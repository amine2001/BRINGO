"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import {
  apiConfig,
  companies,
  delaySettings,
  deliveryTypeMapping,
  getDb,
  storeGroupMapping,
  stores,
  telegramGroups,
  users,
  workflowSettings,
  type DeliveryType,
} from "@/lib/db";
import {
  canAccessApiConfig,
  canAccessUserManagement,
  canDeleteStores,
  isUserRole,
  type UserRole,
} from "@/lib/auth/roles";
import { writeInfoLog } from "@/lib/logs/service";
import {
  requireCompanyContext,
  requireSuperUserContext,
} from "@/lib/tenant/context";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { runCompanyPollingCycle } from "@/lib/control-tower/poll";
import {
  LANGUAGE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  resolveAppLanguage,
  resolveThemePreference,
} from "@/lib/settings/preferences";
import { encodeChatRouting } from "@/lib/delay/chat-routing";

const DELIVERY_TYPES: DeliveryType[] = ["EXPRESS", "MARKET", "HYPER"];

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: FormDataEntryValue | null) {
  const next = asString(value);
  return next || null;
}

function asPositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const next = Number(asString(value));
  if (!Number.isFinite(next) || next < 0) {
    return fallback;
  }

  return Math.trunc(next);
}

function asBoolean(value: FormDataEntryValue | null) {
  return asString(value) === "on";
}

function asRole(value: FormDataEntryValue | null, fallback: UserRole = "operator"): UserRole {
  const next = asString(value);
  return isUserRole(next) ? next : fallback;
}

function slugifyCompanyName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stores");
  revalidatePath("/dashboard/telegram-groups");
  revalidatePath("/dashboard/workflow");
  revalidatePath("/dashboard/notification-settings");
  revalidatePath("/dashboard/delay-settings");
  revalidatePath("/dashboard/api-config");
  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/companies");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/logs");
}

export async function saveDashboardSettingsAction(formData: FormData) {
  const cookieStore = await cookies();
  const language = resolveAppLanguage(asOptionalString(formData.get("language")));
  const theme = resolveThemePreference(asOptionalString(formData.get("theme")));

  cookieStore.set(LANGUAGE_COOKIE_NAME, language, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidateDashboard();
  return {
    language,
    theme,
  };
}

export async function runManualPollAction() {
  const context = await requireCompanyContext();

  await runCompanyPollingCycle(context.company.id);
  await writeInfoLog(
    context.company.id,
    "system",
    "Manual polling cycle completed from dashboard.",
    { userId: context.authUser.id },
  );
  revalidateDashboard();
}

export async function saveStoreAction(formData: FormData) {
  const context = await requireCompanyContext();
  const db = getDb();

  const storeId = asOptionalString(formData.get("storeId"));
  const name = asString(formData.get("name"));
  const code = asOptionalString(formData.get("code"));
  const isActive = asBoolean(formData.get("isActive")) || !storeId;
  const selectedTypes = new Set(
    formData
      .getAll("deliveryTypes")
      .map((value) => asString(value))
      .filter((value): value is DeliveryType =>
        DELIVERY_TYPES.includes(value as DeliveryType),
      ),
  );

  if (!name) {
    throw new Error("Store name is required.");
  }

  let resolvedStoreId = storeId;
  const [matchingNameStore] = await db
    .select({
      id: stores.id,
    })
    .from(stores)
    .where(and(eq(stores.companyId, context.company.id), eq(stores.name, name)))
    .limit(1);

  const [matchingCodeStore] = code
    ? await db
        .select({
          id: stores.id,
        })
        .from(stores)
        .where(and(eq(stores.companyId, context.company.id), eq(stores.code, code)))
        .limit(1)
    : [null];

  if (resolvedStoreId) {
    if (matchingNameStore && matchingNameStore.id !== resolvedStoreId) {
      throw new Error("This store name is already assigned to another store.");
    }

    if (matchingCodeStore && matchingCodeStore.id !== resolvedStoreId) {
      throw new Error("This store code is already assigned to another store.");
    }

    await db
      .update(stores)
      .set({
        name,
        code,
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(stores.id, resolvedStoreId), eq(stores.companyId, context.company.id)));
  } else {
    if (matchingNameStore && matchingCodeStore && matchingNameStore.id !== matchingCodeStore.id) {
      throw new Error("This store code is already assigned to another store.");
    }

    const reusableStore = matchingNameStore ?? matchingCodeStore;

    if (reusableStore) {
      await db
        .update(stores)
        .set({
          name,
          code,
          isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(stores.id, reusableStore.id), eq(stores.companyId, context.company.id)));
      resolvedStoreId = reusableStore.id;
    } else {
      const [createdStore] = await db
        .insert(stores)
        .values({
          companyId: context.company.id,
          name,
          code,
          isActive,
        })
        .onConflictDoUpdate({
          target: [stores.companyId, stores.name],
          set: {
            code,
            isActive,
            updatedAt: new Date(),
          },
        })
        .returning();
      resolvedStoreId = createdStore.id;
    }
  }

  for (const deliveryType of DELIVERY_TYPES) {
    const [existingMapping] = await db
      .select()
      .from(deliveryTypeMapping)
      .where(
        and(
          eq(deliveryTypeMapping.companyId, context.company.id),
          eq(deliveryTypeMapping.storeId, resolvedStoreId),
          eq(deliveryTypeMapping.deliveryType, deliveryType),
        ),
      )
      .limit(1);

    if (existingMapping) {
      await db
        .update(deliveryTypeMapping)
        .set({
          isEnabled: selectedTypes.has(deliveryType),
          updatedAt: new Date(),
        })
        .where(eq(deliveryTypeMapping.id, existingMapping.id));
    } else {
      await db.insert(deliveryTypeMapping).values({
        companyId: context.company.id,
        storeId: resolvedStoreId,
        deliveryType,
        isEnabled: selectedTypes.has(deliveryType),
      });
    }
  }

  await writeInfoLog(context.company.id, "system", `Saved store ${name}.`, {
    storeId: resolvedStoreId,
    deliveryTypes: [...selectedTypes],
  });
  revalidateDashboard();
}

export async function toggleStoreActiveAction(formData: FormData) {
  const context = await requireCompanyContext();
  const db = getDb();
  const storeId = asString(formData.get("storeId"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  if (!storeId) {
    throw new Error("Store ID is required.");
  }

  await db
    .update(stores)
    .set({
      isActive: nextValue,
      updatedAt: new Date(),
    })
    .where(and(eq(stores.id, storeId), eq(stores.companyId, context.company.id)));

  revalidateDashboard();
}

export async function deleteStoreAction(formData: FormData) {
  const context = await requireCompanyContext();
  if (!canDeleteStores(context.profile?.role)) {
    throw new Error("You do not have permission to delete stores.");
  }

  const db = getDb();
  const storeId = asString(formData.get("storeId"));

  if (!storeId) {
    throw new Error("Store ID is required.");
  }

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.companyId, context.company.id)))
    .limit(1);

  if (!store) {
    throw new Error("Store not found.");
  }

  const linkedGroups = await db
    .select({
      telegramGroupId: storeGroupMapping.telegramGroupId,
    })
    .from(storeGroupMapping)
    .where(
      and(
        eq(storeGroupMapping.companyId, context.company.id),
        eq(storeGroupMapping.storeId, storeId),
      ),
    );

  const candidateGroupIds = [...new Set(linkedGroups.map((row) => row.telegramGroupId))];

  await db
    .delete(stores)
    .where(and(eq(stores.id, storeId), eq(stores.companyId, context.company.id)));

  for (const telegramGroupId of candidateGroupIds) {
    const [remainingMapping] = await db
      .select({ id: storeGroupMapping.id })
      .from(storeGroupMapping)
      .where(
        and(
          eq(storeGroupMapping.companyId, context.company.id),
          eq(storeGroupMapping.telegramGroupId, telegramGroupId),
        ),
      )
      .limit(1);

    if (!remainingMapping) {
      await db
        .delete(telegramGroups)
        .where(
          and(
            eq(telegramGroups.id, telegramGroupId),
            eq(telegramGroups.companyId, context.company.id),
          ),
        );
    }
  }

  await writeInfoLog(context.company.id, "system", `Removed store ${store.name}.`, {
    storeId,
    removedTelegramGroups: candidateGroupIds.length,
  });
  revalidateDashboard();
}

export async function saveTelegramGroupAction(formData: FormData) {
  const context = await requireCompanyContext();
  const db = getDb();

  const groupId = asOptionalString(formData.get("groupId"));
  const chatId = asString(formData.get("chatId"));
  const storeId = asString(formData.get("storeId"));

  if (!chatId || !storeId) {
    throw new Error("Telegram chat ID and store are required.");
  }

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.companyId, context.company.id)))
    .limit(1);

  if (!store) {
    throw new Error("The selected store could not be found.");
  }

  const enabledTypeRows = await db
    .select()
    .from(deliveryTypeMapping)
    .where(
      and(
        eq(deliveryTypeMapping.companyId, context.company.id),
        eq(deliveryTypeMapping.storeId, storeId),
        eq(deliveryTypeMapping.isEnabled, true),
      ),
    );

  const enabledTypes = enabledTypeRows.map((row) => row.deliveryType);

  if (enabledTypes.length === 0) {
    throw new Error("Enable at least one delivery type on the store before assigning a Telegram group.");
  }

  let resolvedGroupId = groupId;
  const derivedGroupName = `${store.name} Telegram`;

  if (resolvedGroupId) {
    const [conflictingGroup] = await db
      .select({
        id: telegramGroups.id,
      })
      .from(telegramGroups)
      .where(
        and(
          eq(telegramGroups.companyId, context.company.id),
          eq(telegramGroups.chatId, chatId),
        ),
      )
      .limit(1);

    if (conflictingGroup && conflictingGroup.id !== resolvedGroupId) {
      throw new Error("This Telegram chat ID is already assigned to another group.");
    }

    await db
      .update(telegramGroups)
      .set({
        name: derivedGroupName,
        chatId,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(telegramGroups.id, resolvedGroupId),
          eq(telegramGroups.companyId, context.company.id),
        ),
      );
  } else {
    const [createdGroup] = await db
      .insert(telegramGroups)
      .values({
        companyId: context.company.id,
        name: derivedGroupName,
        chatId,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [telegramGroups.companyId, telegramGroups.chatId],
        set: {
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();
    resolvedGroupId = createdGroup.id;
  }

  for (const deliveryType of enabledTypes) {
    const [existingMapping] = await db
      .select()
      .from(storeGroupMapping)
      .where(
        and(
          eq(storeGroupMapping.companyId, context.company.id),
          eq(storeGroupMapping.storeId, storeId),
          eq(storeGroupMapping.deliveryType, deliveryType),
        ),
      )
      .limit(1);

    if (existingMapping) {
      await db
        .update(storeGroupMapping)
        .set({
          telegramGroupId: resolvedGroupId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(storeGroupMapping.id, existingMapping.id));
    } else {
      await db.insert(storeGroupMapping).values({
        companyId: context.company.id,
        storeId,
        telegramGroupId: resolvedGroupId,
        deliveryType,
        isActive: true,
      });
    }
  }

  revalidateDashboard();
}

export async function saveWorkflowSettingsAction(formData: FormData) {
  const context = await requireCompanyContext();
  const db = getDb();

  const acceptanceGraceMinutes = asPositiveInt(formData.get("acceptanceGraceMinutes"), 3);
  const acceptanceReminderIntervalMinutes = asPositiveInt(
    formData.get("acceptanceReminderIntervalMinutes"),
    2,
  );
  const preparationMinutesPerProduct = asPositiveInt(
    formData.get("preparationMinutesPerProduct"),
    2,
  );
  const preparationReminderIntervalMinutes = asPositiveInt(
    formData.get("preparationReminderIntervalMinutes"),
    2,
  );
  const deliveryAlertReminderIntervalMinutes = asPositiveInt(
    formData.get("deliveryAlertReminderIntervalMinutes"),
    2,
  );

  const existing = await db
    .select()
    .from(workflowSettings)
    .where(eq(workflowSettings.companyId, context.company.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) {
    await db
      .update(workflowSettings)
      .set({
        acceptanceGraceMinutes,
        acceptanceReminderIntervalMinutes,
        preparationMinutesPerProduct,
        preparationReminderIntervalMinutes,
        deliveryAlertReminderIntervalMinutes,
        updatedAt: new Date(),
      })
      .where(eq(workflowSettings.id, existing.id));
  } else {
    await db.insert(workflowSettings).values({
      companyId: context.company.id,
      acceptanceGraceMinutes,
      acceptanceReminderIntervalMinutes,
      preparationMinutesPerProduct,
      preparationReminderIntervalMinutes,
      deliveryAlertReminderIntervalMinutes,
    });
  }

  await writeInfoLog(context.company.id, "system", "Updated workflow timings.", {
    acceptanceGraceMinutes,
    acceptanceReminderIntervalMinutes,
    preparationMinutesPerProduct,
    preparationReminderIntervalMinutes,
    deliveryAlertReminderIntervalMinutes,
  });
  revalidateDashboard();
  redirect("/dashboard/workflow");
}

export async function saveDelaySettingsAction(formData: FormData) {
  const context = await requireCompanyContext();
  const db = getDb();

  const telegramAdminChatId = asString(formData.get("telegramAdminChatId"));
  const opsChatId = asOptionalString(formData.get("opsChatId"));
  const deliveryChatId = asOptionalString(formData.get("deliveryChatId"));
  const delayThresholdMinutes = asPositiveInt(formData.get("delayThresholdMinutes"), 15);
  const enabled = formData.has("enabled") ? asBoolean(formData.get("enabled")) : true;

  if (!telegramAdminChatId) {
    throw new Error("Admin Telegram chat ID is required.");
  }

  const encodedChatRouting = encodeChatRouting({
    fallback: telegramAdminChatId,
    acceptance: opsChatId ?? undefined,
    preparation: opsChatId ?? undefined,
    delivery: deliveryChatId ?? undefined,
  });

  const existing = await db
    .select()
    .from(delaySettings)
    .where(eq(delaySettings.companyId, context.company.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existing) {
    await db
      .update(delaySettings)
      .set({
        telegramAdminChatId: encodedChatRouting,
        delayThresholdMinutes,
        isActive: enabled,
        updatedAt: new Date(),
      })
      .where(eq(delaySettings.id, existing.id));
  } else {
    await db.insert(delaySettings).values({
      companyId: context.company.id,
      telegramAdminChatId: encodedChatRouting,
      delayThresholdMinutes,
      isActive: enabled,
    });
  }

  revalidateDashboard();
}

export async function saveApiConfigAction(formData: FormData) {
  const context = await requireCompanyContext();
  if (!canAccessApiConfig(context.profile?.role)) {
    throw new Error("You do not have permission to manage API configuration.");
  }

  const db = getDb();

  const redashApiUrl = asString(formData.get("redashApiUrl"));
  const redashApiKey = asString(formData.get("redashApiKey"));
  const responseFormat = asString(formData.get("responseFormat")) || "auto";
  const pollIntervalSeconds = asPositiveInt(formData.get("pollIntervalSeconds"), 60);

  if (!redashApiUrl) {
    throw new Error("Redash API URL is required.");
  }

  const existing = await db
    .select()
    .from(apiConfig)
    .where(eq(apiConfig.companyId, context.company.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  const apiKeyToPersist = redashApiKey || existing?.redashApiKey;

  if (!apiKeyToPersist) {
    throw new Error("Redash API key is required.");
  }

  if (existing) {
    await db
      .update(apiConfig)
      .set({
        redashApiUrl,
        redashApiKey: apiKeyToPersist,
        responseFormat:
          responseFormat === "json" || responseFormat === "csv" ? responseFormat : "auto",
        pollIntervalSeconds,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(apiConfig.id, existing.id));
  } else {
    await db.insert(apiConfig).values({
      companyId: context.company.id,
      redashApiUrl,
      redashApiKey: apiKeyToPersist,
      responseFormat:
        responseFormat === "json" || responseFormat === "csv" ? responseFormat : "auto",
      pollIntervalSeconds,
      isActive: true,
    });
  }

  revalidateDashboard();
}

export async function saveUserAction(formData: FormData) {
  const context = await requireCompanyContext();
  if (!canAccessUserManagement(context.profile?.role)) {
    throw new Error("You do not have permission to manage users.");
  }

  const db = getDb();
  const supabaseAdmin = getSupabaseAdminClient();

  const userId = asOptionalString(formData.get("userId"));
  const fullName = asString(formData.get("fullName"));
  const email = asString(formData.get("email"));
  const password = asOptionalString(formData.get("password"));
  const role = asRole(formData.get("role"));

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    if (!password) {
      throw new Error("A password is required when creating a new user.");
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        fullName,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Unable to create Supabase user.");
    }

    resolvedUserId = data.user.id;
  }

  const existingProfile = await db
    .select()
    .from(users)
    .where(eq(users.id, resolvedUserId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingProfile && existingProfile.companyId !== context.company.id) {
    throw new Error("You can only manage Bringo users from this dashboard.");
  }

  const normalizedFullName = fullName || existingProfile?.fullName || email;
  const normalizedEmail = email || existingProfile?.email || "";

  if (!normalizedFullName || !normalizedEmail) {
    throw new Error("Full name and email are required.");
  }

  const targetCompanyId = context.company.id;

  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, targetCompanyId))
    .limit(1);

  if (!company) {
    throw new Error("The selected company could not be found.");
  }

  if (existingProfile) {
    await db
      .update(users)
      .set({
        companyId: targetCompanyId,
        email: normalizedEmail,
        fullName: normalizedFullName,
        role,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resolvedUserId));
  } else {
    await db.insert(users).values({
      id: resolvedUserId,
      companyId: targetCompanyId,
      email: normalizedEmail,
      fullName: normalizedFullName,
      role,
      isActive: true,
    });
  }

  revalidateDashboard();
}

export async function toggleUserActiveAction(formData: FormData) {
  const context = await requireCompanyContext();
  if (!canAccessUserManagement(context.profile?.role)) {
    throw new Error("You do not have permission to manage users.");
  }

  const db = getDb();
  const userId = asString(formData.get("userId"));
  const nextValue = asString(formData.get("nextValue")) === "true";

  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (userId === context.authUser.id) {
    throw new Error("You cannot disable your own access.");
  }

  const [targetUser] = await db
    .select({
      companyId: users.companyId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    throw new Error("User not found.");
  }

  if (targetUser.companyId !== context.company.id) {
    throw new Error("You can only manage Bringo users from this dashboard.");
  }

  await db
    .update(users)
    .set({
      isActive: nextValue,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidateDashboard();
}

export async function saveCompanyAction(formData: FormData) {
  const context = await requireSuperUserContext();
  const db = getDb();

  const name = asString(formData.get("name"));

  if (!name) {
    throw new Error("Company name is required.");
  }

  const slug = slugifyCompanyName(name);

  if (!slug) {
    throw new Error("Unable to generate a valid company slug from this name.");
  }

  const [existingCompany] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (existingCompany) {
    throw new Error("A company with this name already exists.");
  }

  await db.insert(companies).values({
    name,
    slug,
    isActive: true,
  });

  await writeInfoLog(context.company.id, "system", `Created company ${name}.`, {
    companyName: name,
    createdBy: context.authUser.id,
  });

  revalidateDashboard();
}

export async function deleteCompanyAction(formData: FormData) {
  const context = await requireSuperUserContext();
  const db = getDb();
  const companyId = asString(formData.get("companyId"));

  if (!companyId) {
    throw new Error("Company ID is required.");
  }

  if (companyId === context.company.id) {
    throw new Error("Switch to another company before removing the current one.");
  }

  const [company] = await db
    .select({
      id: companies.id,
      name: companies.name,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) {
    throw new Error("Company not found.");
  }

  await db.delete(companies).where(eq(companies.id, companyId));

  await writeInfoLog(context.company.id, "system", `Removed company ${company.name}.`, {
    removedCompanyId: companyId,
    removedBy: context.authUser.id,
  });

  revalidateDashboard();
}
