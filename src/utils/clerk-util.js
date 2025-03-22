const { Clerk } = require('@clerk/clerk-sdk-node');

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const createClerkUser = async ({ email, name, role, password }) => {
    try {
        const user = await clerkClient.users.createUser({
            emailAddress: [email],
            firstName: name,
            password,
            publicMetadata: {
                role: role.toUpperCase(),
            },
        });
        await clerkClient.users.sendEmailInvitation(user.id);

        return {
            status: true,
            data: user,
        };
    } catch (err) {
        console.error('Error creating or inviting user:', err);
        return {
            status: false,
            message: err?.errors[0]?.message,
        };
    }
};

module.exports = {
    createClerkUser,
};
