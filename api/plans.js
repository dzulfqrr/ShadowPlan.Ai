import { getPlans } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const plans = await getPlans();
    
    // Fallback if plans are empty (e.g. database not set up properly or empty sheet)
    if (!plans || plans.length === 0) {
        return res.status(200).json({
            plans: [
                { name: 'Starter', price: 'Rp12k', tokens: 24, recommended: false },
                { name: 'Pro', price: 'Rp50k', tokens: 89, recommended: true },
                { name: 'Yearly', price: 'Rp120k', tokens: 300, recommended: false }
            ]
        });
    }

    return res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Failed to fetch plans', details: error.message });
  }
}
