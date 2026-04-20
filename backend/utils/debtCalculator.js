/**
 * Optimal debt simplification algorithm
 * Input: list of {from, to, amount} debts
 * Output: simplified list of debts (minimum number of transactions)
 */

function simplifyDebts(debts) {
  if (!debts || debts.length === 0) return [];

  // Step 1: Net all debts (A owes B 50, B owes A 30 => A owes B 20)
  const netBalance = {};

  for (const debt of debts) {
    const { from, to, amount } = debt;
    if (amount <= 0) continue;

    if (!netBalance[from]) netBalance[from] = 0;
    if (!netBalance[to]) netBalance[to] = 0;

    netBalance[from] -= amount; // from owes money (negative = owes)
    netBalance[to] += amount;   // to is owed money (positive = owed)
  }

  // Step 2: Separate into creditors (positive) and debtors (negative)
  const creditors = []; // people who are owed money
  const debtors = [];   // people who owe money

  for (const [userId, balance] of Object.entries(netBalance)) {
    if (balance > 0.01) {
      creditors.push({ userId: parseInt(userId), amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId: parseInt(userId), amount: -balance });
    }
    // Skip if nearly zero (settled)
  }

  // Step 3: Greedily match debtors with creditors
  const result = [];
  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      result.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return result;
}

/**
 * Calculate debts from a list of group bills
 * Each bill: { payer_id, amount, participants: [user_id, ...] }
 * Returns: array of {from, to, amount} representing raw debts before simplification
 */
function calculateRawDebts(bills) {
  const rawDebts = [];

  for (const bill of bills) {
    const { payer_id, amount, participants } = bill;
    if (!participants || participants.length === 0) continue;

    const splitAmount = amount / participants.length;

    for (const participantId of participants) {
      // Each participant owes the payer their share
      if (participantId !== payer_id) {
        rawDebts.push({
          from: participantId,
          to: payer_id,
          amount: Math.round(splitAmount * 100) / 100
        });
      }
    }
  }

  return rawDebts;
}

/**
 * Calculate and simplify all debts from group bills
 * Returns: simplified list of {from, to, amount} debts
 */
function calculateGroupDebts(bills) {
  const rawDebts = calculateRawDebts(bills);
  return simplifyDebts(rawDebts);
}

module.exports = {
  simplifyDebts,
  calculateRawDebts,
  calculateGroupDebts
};
