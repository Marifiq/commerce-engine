import prisma from "../db.js";

/**
 * Helper function to link guest orders to a user account
 * This is called when a user logs in or signs up to associate their previous guest orders
 * @param userId - The user ID to link orders to
 * @param email - The email address to match guest orders against
 * @returns The number of orders linked
 */
export const linkGuestOrdersToUser = async (userId: number, email: string): Promise<number> => {
  try {
    // Find all guest orders (where userId is null) that match the user's email
    const guestOrders = await prisma.order.findMany({
      where: {
        userId: null,
        customerEmail: email.toLowerCase(),
      },
    });

    if (guestOrders.length > 0) {
      // Update all guest orders to link them to the user
      await prisma.order.updateMany({
        where: {
          id: { in: guestOrders.map((o) => o.id) },
        },
        data: {
          userId: userId,
        },
      });

      console.log(`Linked ${guestOrders.length} guest order(s) to user ${userId}`);
    }

    return guestOrders.length;
  } catch (error) {
    console.error("Error linking guest orders to user:", error);
    // Don't throw - this is a background operation that shouldn't fail login
    return 0;
  }
};




