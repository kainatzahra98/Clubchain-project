const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

/**
 * Create a Stripe Checkout Session for membership purchase
 * @param {Object} plan - The MembershipPlan model object
 * @param {Object} user - The User model object
 * @param {string} clubId - The ID of the club being joined
 * @param {string} successUrl - URL to redirect on success
 * @param {string} cancelUrl - URL to redirect on cancel
 */
const createCheckoutSession = async (plan, user, clubId, successUrl, cancelUrl) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic',
                },
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${plan.title} Membership`,
                            description: plan.description,
                        },
                        unit_amount: Math.round(parseFloat(plan.price) * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: user.email,
            client_reference_id: user._id.toString(),
            metadata: {
                userId: user._id.toString(),
                clubId: clubId.toString(),
                planId: plan._id.toString(),
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return session;
    } catch (error) {
        console.error('Stripe Session Error:', error);
        throw error;
    }
};

/**
 * Construct Stripe Event from Webhook Payload
 */
const constructEvent = (payload, signature, secret) => {
    return stripe.webhooks.constructEvent(payload, signature, secret);
};

module.exports = {
    createCheckoutSession,
    constructEvent
};
