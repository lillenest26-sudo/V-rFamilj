import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  familyMembers, calendarEvents, tasks, reminders, mealPlans,
  shoppingItems, transactions, savingsGoals, albums, photos,
  documents, diaryEntries, familyGoals, rewards, pointTransactions,
  chatMessages
} from "../drizzle/schema";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// ─── Calendar Router ──────────────────────────────────────────────────────────
const calendarRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const now = new Date();
      const q = db.select().from(calendarEvents)
        .where(and(eq(calendarEvents.userId, ctx.user.id), gte(calendarEvents.startTime, now)))
        .orderBy(asc(calendarEvents.startTime))
        .limit(input?.limit ?? 50);
      return q;
    }),
  listAll: protectedProcedure
    .input(z.object({ start: z.string().optional(), end: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      let q = db.select().from(calendarEvents)
        .where(eq(calendarEvents.userId, ctx.user.id))
        .orderBy(asc(calendarEvents.startTime));
      return q;
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      startTime: z.string(),
      endTime: z.string().optional(),
      allDay: z.boolean().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      recurrence: z.enum(["none","daily","weekly","monthly","yearly"]).optional(),
      assignedTo: z.array(z.number()).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(calendarEvents).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: input.endTime ? new Date(input.endTime) : undefined,
        allDay: input.allDay ?? false,
        color: input.color ?? "#6366f1",
        icon: input.icon,
        location: input.location,
        category: input.category ?? "general",
        recurrence: input.recurrence ?? "none",
        assignedTo: input.assignedTo ?? [],
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      allDay: z.boolean().optional(),
      color: z.string().optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      recurrence: z.enum(["none","daily","weekly","monthly","yearly"]).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, startTime, endTime, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      await db.update(calendarEvents).set(updateData as unknown as any).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(calendarEvents).where(and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Tasks Router ─────────────────────────────────────────────────────────────
const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(tasks)
        .where(eq(tasks.userId, ctx.user.id))
        .orderBy(desc(tasks.createdAt))
        .limit(input?.limit ?? 100);
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["low","medium","high","urgent"]).optional(),
      dueDate: z.string().optional(),
      assignedTo: z.number().optional(),
      category: z.string().optional(),
      points: z.number().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(tasks).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        assignedTo: input.assignedTo,
        category: input.category,
        points: input.points ?? 0,
        imageUrl: input.imageUrl,
        status: "pending",
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["pending","in_progress","done"]).optional(),
      priority: z.enum(["low","medium","high","urgent"]).optional(),
      dueDate: z.string().optional(),
      assignedTo: z.number().optional(),
      category: z.string().optional(),
      points: z.number().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, dueDate, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (dueDate) updateData.dueDate = new Date(dueDate);
      // Award points when task is completed
      if (rest.status === "done") {
        const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id)));
        if (task?.assignedTo && task.points && task.points > 0) {
          await db.update(familyMembers)
            .set({ points: sql`${familyMembers.points} + ${task.points}` })
            .where(eq(familyMembers.id, task.assignedTo));
          await db.insert(pointTransactions).values({
            userId: ctx.user.id,
            memberId: task.assignedTo,
            points: task.points,
            reason: `Task completed: ${task.title}`,
            taskId: id,
          });
        }
      }
      await db.update(tasks).set(updateData as unknown as any).where(and(eq(tasks.id, id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(tasks).where(and(eq(tasks.id, input.id), eq(tasks.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Reminders Router ─────────────────────────────────────────────────────────
const remindersRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    return db.select().from(reminders)
      .where(and(eq(reminders.userId, ctx.user.id), gte(reminders.remindAt, start), lte(reminders.remindAt, end)))
      .orderBy(asc(reminders.remindAt));
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(reminders)
      .where(eq(reminders.userId, ctx.user.id))
      .orderBy(asc(reminders.remindAt));
  }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      remindAt: z.string(),
      type: z.enum(["normal","important","urgent"]).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(reminders).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        remindAt: new Date(input.remindAt),
        type: input.type ?? "normal",
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      done: z.boolean().optional(),
      title: z.string().optional(),
      remindAt: z.string().optional(),
      type: z.enum(["normal","important","urgent"]).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, remindAt, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (remindAt) updateData.remindAt = new Date(remindAt);
      await db.update(reminders).set(updateData as unknown as any).where(and(eq(reminders.id, id), eq(reminders.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(reminders).where(and(eq(reminders.id, input.id), eq(reminders.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Meal Plan Router ─────────────────────────────────────────────────────────
const mealPlanRouter = router({
  list: protectedProcedure
    .input(z.object({ weekStart: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(mealPlans)
        .where(and(eq(mealPlans.userId, ctx.user.id), eq(mealPlans.weekStart, new Date(input.weekStart))))
        .orderBy(asc(mealPlans.dayOfWeek));
    }),
  create: protectedProcedure
    .input(z.object({
      weekStart: z.string(),
      dayOfWeek: z.number().min(0).max(6),
      mealType: z.enum(["breakfast","lunch","dinner","snack"]),
      title: z.string().min(1),
      description: z.string().optional(),
      recipe: z.string().optional(),
      ingredients: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(mealPlans).values({
        userId: ctx.user.id,
        weekStart: new Date(input.weekStart),
        dayOfWeek: input.dayOfWeek,
        mealType: input.mealType,
        title: input.title,
        description: input.description,
        recipe: input.recipe,
        ingredients: input.ingredients ?? [],
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      recipe: z.string().optional(),
      ingredients: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(mealPlans).set(rest as unknown as any).where(and(eq(mealPlans.id, id), eq(mealPlans.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(mealPlans).where(and(eq(mealPlans.id, input.id), eq(mealPlans.userId, ctx.user.id)));
      return { success: true };
    }),
  generateShoppingList: protectedProcedure
    .input(z.object({ weekStart: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const meals = await db.select().from(mealPlans)
        .where(and(eq(mealPlans.userId, ctx.user.id), eq(mealPlans.weekStart, new Date(input.weekStart))));
      // Delete existing meal-plan shopping items for this week
      await db.delete(shoppingItems)
        .where(and(eq(shoppingItems.userId, ctx.user.id), eq(shoppingItems.fromMealPlan, true), eq(shoppingItems.weekStart, new Date(input.weekStart))));
      // Collect all ingredients
      const allIngredients: string[] = [];
      for (const meal of meals) {
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          allIngredients.push(...(meal.ingredients as string[]));
        }
      }
      // Deduplicate and insert
      const uniqueSet = new Set(allIngredients);
      const unique = Array.from(uniqueSet);
      for (const ingredient of unique) {
        await db.insert(shoppingItems).values({
          userId: ctx.user.id,
          name: ingredient,
          category: "other",
          fromMealPlan: true,
          weekStart: new Date(input.weekStart),
        });
      }
      return { count: unique.length };
    }),
});

// ─── Shopping Router ──────────────────────────────────────────────────────────
const shoppingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(shoppingItems)
      .where(eq(shoppingItems.userId, ctx.user.id))
      .orderBy(asc(shoppingItems.category), asc(shoppingItems.name));
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["fruit","vegetable","meat","dairy","bread","drink","other"]).optional(),
      quantity: z.string().optional(),
      price: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(shoppingItems).values({
        userId: ctx.user.id,
        name: input.name,
        category: input.category ?? "other",
        quantity: input.quantity,
        price: input.price,
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  toggle: protectedProcedure
    .input(z.object({ id: z.number(), bought: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(shoppingItems).set({ bought: input.bought })
        .where(and(eq(shoppingItems.id, input.id), eq(shoppingItems.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(shoppingItems).where(and(eq(shoppingItems.id, input.id), eq(shoppingItems.userId, ctx.user.id)));
      return { success: true };
    }),
  clearBought: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(shoppingItems).where(and(eq(shoppingItems.userId, ctx.user.id), eq(shoppingItems.bought, true)));
    return { success: true };
  }),
});

// ─── Budget Router ────────────────────────────────────────────────────────────
const budgetRouter = router({
  transactions: protectedProcedure
    .input(z.object({ month: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .orderBy(desc(transactions.date));
    }),
  addTransaction: protectedProcedure
    .input(z.object({
      type: z.enum(["income","expense"]),
      amount: z.string(),
      category: z.string(),
      description: z.string().optional(),
      date: z.string(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(transactions).values({
        userId: ctx.user.id,
        type: input.type,
        amount: input.amount,
        category: input.category,
        description: input.description,
        date: new Date(input.date),
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  updateTransaction: protectedProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["income","expense"]).optional(),
      amount: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      const updateData: any = {};
      if (rest.type) updateData.type = rest.type;
      if (rest.amount) updateData.amount = rest.amount;
      if (rest.category) updateData.category = rest.category;
      if (rest.description !== undefined) updateData.description = rest.description;
      if (rest.date) updateData.date = new Date(rest.date);
      if (rest.imageUrl !== undefined) updateData.imageUrl = rest.imageUrl;
      await db.update(transactions).set(updateData).where(and(eq(transactions.id, id), eq(transactions.userId, ctx.user.id)));
      return { success: true };
    }),
  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(transactions).where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)));
      return { success: true };
    }),
  savingsGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(savingsGoals)
      .where(eq(savingsGoals.userId, ctx.user.id))
      .orderBy(desc(savingsGoals.createdAt));
  }),
  createSavingsGoal: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      targetAmount: z.string(),
      currentAmount: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      deadline: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(savingsGoals).values({
        userId: ctx.user.id,
        title: input.title,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount ?? "0",
        icon: input.icon,
        color: input.color ?? "#6366f1",
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  updateSavingsGoal: protectedProcedure
    .input(z.object({
      id: z.number(),
      currentAmount: z.string().optional(),
      title: z.string().optional(),
      targetAmount: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(savingsGoals).set(rest as unknown as any).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, ctx.user.id)));
      return { success: true };
    }),
  deleteSavingsGoal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(savingsGoals).where(and(eq(savingsGoals.id, input.id), eq(savingsGoals.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Family Router ────────────────────────────────────────────────────────────
const familyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(familyMembers)
      .where(eq(familyMembers.userId, ctx.user.id))
      .orderBy(asc(familyMembers.name));
  }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      role: z.enum(["parent","child"]).optional(),
      color: z.string().optional(),
      birthday: z.string().optional(),
      notes: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(familyMembers).values({
        userId: ctx.user.id,
        name: input.name,
        role: input.role ?? "child",
        color: input.color ?? "#6366f1",
        birthday: input.birthday ? new Date(input.birthday) : undefined,
        notes: input.notes,
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.enum(["parent","child"]).optional(),
      color: z.string().optional(),
      birthday: z.string().optional(),
      notes: z.string().optional(),
      imageUrl: z.string().optional(),
      points: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(familyMembers).set(rest as unknown as any).where(and(eq(familyMembers.id, id), eq(familyMembers.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(familyMembers).where(and(eq(familyMembers.id, input.id), eq(familyMembers.userId, ctx.user.id)));
      return { success: true };
    }),
  uploadImage: protectedProcedure
    .input(z.object({ memberId: z.number(), fileData: z.string(), fileName: z.string(), mimeType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const key = `family-images/${ctx.user.id}/${input.memberId}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(familyMembers).set({ imageUrl: url }).where(and(eq(familyMembers.id, input.memberId), eq(familyMembers.userId, ctx.user.id)));
      return { url };
    }),
});

// ─── Photos Router ────────────────────────────────────────────────────────────
const photosRouter = router({
  albums: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(albums)
      .where(eq(albums.userId, ctx.user.id))
      .orderBy(desc(albums.createdAt));
  }),
  createAlbum: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(albums).values({ userId: ctx.user.id, title: input.title, description: input.description });
      return { success: true };
    }),
  deleteAlbum: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(albums).where(and(eq(albums.id, input.id), eq(albums.userId, ctx.user.id)));
      return { success: true };
    }),
  photos: protectedProcedure
    .input(z.object({ albumId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(photos.userId, ctx.user.id)];
      if (input?.albumId) conditions.push(eq(photos.albumId, input.albumId));
      return db.select().from(photos)
        .where(and(...conditions))
        .orderBy(desc(photos.createdAt));
    }),
  uploadPhoto: protectedProcedure
    .input(z.object({
      albumId: z.number().optional(),
      fileData: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const key = `photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(photos).values({
        userId: ctx.user.id,
        albumId: input.albumId,
        url,
        fileKey: key,
        caption: input.caption,
      });
      return { url };
    }),
  deletePhoto: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(photos).where(and(eq(photos.id, input.id), eq(photos.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Documents Router ─────────────────────────────────────────────────────────
const documentsRouter = router({
  list: protectedProcedure
    .input(z.object({ folder: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(documents.userId, ctx.user.id)];
      if (input?.folder) conditions.push(eq(documents.folder, input.folder));
      return db.select().from(documents)
        .where(and(...conditions))
        .orderBy(desc(documents.createdAt));
    }),
  upload: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      folder: z.string().optional(),
      fileData: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      size: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileData, "base64");
      const key = `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(documents).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        folder: input.folder ?? "general",
        url,
        fileKey: key,
        mimeType: input.mimeType,
        size: input.size,
      });
      return { url };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(documents).where(and(eq(documents.id, input.id), eq(documents.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Diary Router ─────────────────────────────────────────────────────────────
const diaryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(diaryEntries)
      .where(eq(diaryEntries.userId, ctx.user.id))
      .orderBy(desc(diaryEntries.entryDate));
  }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
      content: z.string().min(1),
      mood: z.enum(["happy","neutral","sad","excited","tired"]).optional(),
      entryDate: z.string(),
      memberId: z.number().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(diaryEntries).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        mood: input.mood ?? "neutral",
        entryDate: new Date(input.entryDate),
        memberId: input.memberId,
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      mood: z.enum(["happy","neutral","sad","excited","tired"]).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(diaryEntries).set(rest as unknown as any).where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(diaryEntries).where(and(eq(diaryEntries.id, input.id), eq(diaryEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Goals Router ─────────────────────────────────────────────────────────────
const goalsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(familyGoals)
        .where(eq(familyGoals.userId, ctx.user.id))
        .orderBy(desc(familyGoals.createdAt))
        .limit(input?.limit ?? 100);
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      targetDate: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(familyGoals).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        icon: input.icon,
        color: input.color ?? "#6366f1",
        imageUrl: input.imageUrl,
      });
      return { success: true };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
      completed: z.boolean().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...rest } = input;
      await db.update(familyGoals).set(rest as unknown as any).where(and(eq(familyGoals.id, id), eq(familyGoals.userId, ctx.user.id)));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(familyGoals).where(and(eq(familyGoals.id, input.id), eq(familyGoals.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Rewards Router ───────────────────────────────────────────────────────────
const rewardsRouter = router({
  list: protectedProcedure
    .input(z.object({ memberId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(rewards.userId, ctx.user.id)];
      if (input?.memberId) conditions.push(eq(rewards.memberId, input.memberId));
      return db.select().from(rewards).where(and(...conditions)).orderBy(asc(rewards.pointsCost));
    }),
  create: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      pointsCost: z.number().min(1),
      icon: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(rewards).values({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
  unlock: protectedProcedure
    .input(z.object({ id: z.number(), memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [reward] = await db.select().from(rewards).where(and(eq(rewards.id, input.id), eq(rewards.userId, ctx.user.id)));
      if (!reward) throw new TRPCError({ code: "NOT_FOUND" });
      const [member] = await db.select().from(familyMembers).where(and(eq(familyMembers.id, input.memberId), eq(familyMembers.userId, ctx.user.id)));
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if ((member.points ?? 0) < reward.pointsCost) throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough points" });
      await db.update(familyMembers)
        .set({ points: sql`${familyMembers.points} - ${reward.pointsCost}` })
        .where(eq(familyMembers.id, input.memberId));
      await db.update(rewards).set({ unlocked: true, unlockedAt: new Date() }).where(eq(rewards.id, input.id));
      await db.insert(pointTransactions).values({
        userId: ctx.user.id,
        memberId: input.memberId,
        points: -reward.pointsCost,
        reason: `Reward unlocked: ${reward.title}`,
      });
      return { success: true };
    }),
  addPoints: protectedProcedure
    .input(z.object({ memberId: z.number(), points: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(familyMembers)
        .set({ points: sql`${familyMembers.points} + ${input.points}` })
        .where(and(eq(familyMembers.id, input.memberId), eq(familyMembers.userId, ctx.user.id)));
      await db.insert(pointTransactions).values({
        userId: ctx.user.id,
        memberId: input.memberId,
        points: input.points,
        reason: input.reason ?? "Points added",
      });
      return { success: true };
    }),
  pointHistory: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(pointTransactions)
        .where(and(eq(pointTransactions.userId, ctx.user.id), eq(pointTransactions.memberId, input.memberId)))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(50);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(rewards).where(and(eq(rewards.id, input.id), eq(rewards.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── AI Chat Router ───────────────────────────────────────────────────────────
const aiRouter = router({
  history: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(chatMessages)
      .where(eq(chatMessages.userId, ctx.user.id))
      .orderBy(asc(chatMessages.createdAt))
      .limit(100);
  }),
  chat: protectedProcedure
    .input(z.object({ message: z.string().min(1), language: z.enum(["sv","so"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Save user message
      await db.insert(chatMessages).values({ userId: ctx.user.id, role: "user", content: input.message });
      // Get recent history
      const history = await db.select().from(chatMessages)
        .where(eq(chatMessages.userId, ctx.user.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);
      const systemPrompt = input.language === "so"
        ? "Adiga waxaad tahay caawiye qoys oo saaxiibtinimo leh. Waxaad caawisaa qoysaska qorshaha, karinta, miisaaniyada iyo hawlgalada. Ku jawaab Soomaali."
        : "Du är en vänlig och hjälpsam familjeassistent. Du hjälper familjer med planering, matlagning, budget och aktiviteter. Svara alltid på svenska om inte användaren skriver på ett annat språk.";
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...history.reverse().slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];
      const response = await invokeLLM({ messages });
      const rawContent = response.choices?.[0]?.message?.content;
      const assistantMessage = typeof rawContent === "string" ? rawContent : "Tyvärr kunde jag inte svara just nu.";
      await db.insert(chatMessages).values({ userId: ctx.user.id, role: "assistant", content: assistantMessage });
      return { message: assistantMessage };
    }),
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(chatMessages).where(eq(chatMessages.userId, ctx.user.id));
    return { success: true };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  calendar: calendarRouter,
  tasks: tasksRouter,
  reminders: remindersRouter,
  mealPlan: mealPlanRouter,
  shopping: shoppingRouter,
  budget: budgetRouter,
  family: familyRouter,
  photos: photosRouter,
  documents: documentsRouter,
  diary: diaryRouter,
  goals: goalsRouter,
  rewards: rewardsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
