// src/pages/GroupSettlements.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  Check,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

/**
 * GroupSettlements Component
 * Facilitates equal bill-splitting among trip participants. Displays who paid what,
 * computes debts, permits inviting travellers, and generates/settles debt records.
 */
export default function GroupSettlements() {
  const { id, tripId } = useParams();
  const effectiveTripId = tripId || id;

  const [travellers, setTravellers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add traveller form state
  const [showAddTraveller, setShowAddTraveller] = useState(false);
  const [travellerEmail, setTravellerEmail] = useState('');
  const [submittingTraveller, setSubmittingTraveller] = useState(false);
  const [travellerError, setTravellerError] = useState(null);

  // Auto-generate settlements state
  const [generating, setGenerating] = useState(false);
  const [settlingId, setSettlingId] = useState(null);

  // Fetch all group data for the trip
  const fetchGroupData = useCallback(async () => {
    if (!effectiveTripId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch travellers
      let travellersList = [];
      try {
        const travData = await api.get(`/api/trips/${effectiveTripId}/travellers`);
        travellersList = Array.isArray(travData) ? travData : travData?.travellers || [];
      } catch {
        travellersList = [];
      }

      // 2. Fetch expenses
      let expensesList = [];
      try {
        const expData = await api.get(`/api/trips/${effectiveTripId}/expenses`);
        expensesList = Array.isArray(expData) ? expData : expData?.expenses || [];
      } catch {
        expensesList = [];
      }

      // 3. Fetch existing settlements
      let settlementsList = [];
      try {
        const settData = await api.get(`/api/trips/${effectiveTripId}/settlements`);
        settlementsList = Array.isArray(settData) ? settData : settData?.settlements || [];
      } catch {
        settlementsList = [];
      }

      setTravellers(travellersList);
      setExpenses(expensesList);
      setSettlements(settlementsList);
    } catch (err) {
      setError(err.message || 'Failed to load group settlement data.');
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Handle adding / inviting a traveller
  const handleAddTraveller = async (e) => {
    e.preventDefault();
    if (!travellerEmail.trim() || !travellerEmail.includes('@')) {
      setTravellerError('Please provide a valid email address.');
      return;
    }

    setSubmittingTraveller(true);
    setTravellerError(null);
    try {
      const payload = { email: travellerEmail.trim().toLowerCase() };
      const response = await api.post(`/api/trips/${effectiveTripId}/travellers`, payload);
      const newTraveller = response?.traveller || response || {
        id: `trav-${Date.now()}`,
        email: travellerEmail.trim().toLowerCase(),
        name: travellerEmail.split('@')[0],
      };

      setTravellers((prev) => [...prev, newTraveller]);
      setTravellerEmail('');
      setShowAddTraveller(false);
    } catch (err) {
      setTravellerError(err.message || 'Failed to add traveller. Please try again.');
    } finally {
      setSubmittingTraveller(false);
    }
  };

  // Calculate totals and individual shares
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const numTravellers = travellers.length > 0 ? travellers.length : 1;
  const equalSplitShare = totalExpenses / numTravellers;

  // Compute how much each traveller has paid
  const travellersWithBalances = travellers.map((t) => {
    const tName = t.user?.name || t.name || '';
    const tEmail = t.user?.email || t.email || '';
    const tIdentifier = (tName || tEmail || '').toLowerCase();
    const tId = String(t.id || t._id || t.user?._id || '');

    // Sum expenses where payer matches this traveller
    const paid = expenses
      .filter((exp) => {
        const payerName = (exp.payer?.name || exp.payerName || exp.payer_name || '').toLowerCase();
        const payerEmail = (exp.payer?.email || exp.payerEmail || '').toLowerCase();
        const payerId = String(exp.payer?._id || exp.payer || exp.travellerId || exp.userId || '');

        return (
          (payerId && payerId === tId) ||
          (tIdentifier && (payerName === tIdentifier || payerEmail === tIdentifier)) ||
          (tEmail && payerEmail === tEmail.toLowerCase()) ||
          (tName && payerName === tName.toLowerCase())
        );
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const balance = paid - equalSplitShare;
    return {
      ...t,
      name: tName || tEmail.split('@')[0],
      email: tEmail,
      userId: t.user?._id || t.user?.id || t.id || t._id,
      paid,
      balance,
    };
  });

  // Calculate debt settlements mathematically (debtors -> creditors)
  const calculateDebts = () => {
    if (travellersWithBalances.length <= 1) return [];

    const debtors = [];
    const creditors = [];

    travellersWithBalances.forEach((t) => {
      const bal = Number(t.balance.toFixed(2));
      const displayName = t.name || t.email.split('@')[0];
      if (bal < -0.01) {
        debtors.push({ ...t, displayName, amountToPay: Math.abs(bal) });
      } else if (bal > 0.01) {
        creditors.push({ ...t, displayName, amountToReceive: bal });
      }
    });

    const calculatedSettlements = [];
    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const debtor = debtors[dIndex];
      const creditor = creditors[cIndex];

      const settlementAmount = Math.min(debtor.amountToPay, creditor.amountToReceive);
      if (settlementAmount > 0.01) {
        calculatedSettlements.push({
          debtorName: debtor.displayName,
          debtorEmail: debtor.email,
          fromUser: debtor.userId || debtor.id || debtor._id,
          creditorName: creditor.displayName,
          creditorEmail: creditor.email,
          toUser: creditor.userId || creditor.id || creditor._id,
          amount: parseFloat(settlementAmount.toFixed(2)),
          status: 'pending',
        });
      }

      debtor.amountToPay -= settlementAmount;
      creditor.amountToReceive -= settlementAmount;

      if (debtor.amountToPay < 0.01) dIndex++;
      if (creditor.amountToReceive < 0.01) cIndex++;
    }

    return calculatedSettlements;
  };

  const computedDebts = calculateDebts();

  // Auto-generate settlements by calculating splits and posting to the backend
  const handleAutoGenerateSettlements = async () => {
    if (computedDebts.length === 0) {
      alert('No debts found to settle. Everyone is even or no expenses have been recorded.');
      return;
    }

    setGenerating(true);
    try {
      // Create settlements sequentially or collectively
      const createdSettlements = [];
      for (const debt of computedDebts) {
        const payload = {
          fromUser: debt.fromUser || debt.debtorName || debt.debtorEmail,
          toUser: debt.toUser || debt.creditorName || debt.creditorEmail,
          debtor: debt.debtorName || debt.debtorEmail,
          creditor: debt.creditorName || debt.creditorEmail,
          amount: debt.amount,
          status: 'pending',
        };

        let result;
        try {
          result = await api.post(`/api/trips/${effectiveTripId}/settlements`, payload);
        } catch {
          result = await api.post('/api/settlements', { ...payload, tripId: effectiveTripId });
        }
        createdSettlements.push(result?.settlement || result || { ...payload, id: `settle-${Date.now()}` });
      }

      setSettlements(createdSettlements);
    } catch (err) {
      alert(err.message || 'Failed to auto-generate settlements.');
    } finally {
      setGenerating(false);
    }
  };

  // Mark a settlement record as settled
  const handleMarkAsSettled = async (settlementId) => {
    setSettlingId(settlementId);
    try {
      try {
        await api.put(`/api/settlements/${settlementId}`, { status: 'settled' });
      } catch {
        await api.put(`/api/trips/${effectiveTripId}/settlements/${settlementId}`, { status: 'settled' });
      }

      // Update state locally
      setSettlements((prev) =>
        prev.map((s) => ((s.id || s._id) === settlementId ? { ...s, status: 'settled' } : s))
      );
    } catch (err) {
      alert(err.message || 'Failed to update settlement status.');
    } finally {
      setSettlingId(null);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Calculating group balances...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchGroupData} />
        <Link
          to={`/trips/${effectiveTripId}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Return to Trip Details
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={`/trips/${effectiveTripId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Trip Details
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Group Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Split group costs equally, calculate who owes whom, and keep track of settled debts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={showAddTraveller ? 'secondary' : 'primary'}
            onClick={() => setShowAddTraveller(!showAddTraveller)}
          >
            <span className="flex items-center gap-2">
              <UserPlus size={18} />
              {showAddTraveller ? 'Cancel' : 'Invite Traveller'}
            </span>
          </Button>

          {travellers.length > 1 && expenses.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleAutoGenerateSettlements}
              disabled={generating}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                {generating ? 'Generating...' : 'Auto-Generate Settlements'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Expenses</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">${totalExpenses.toFixed(2)}</h3>
          <p className="text-xs text-gray-400 mt-1">Combined expenditure</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group Members</span>
            <Users size={18} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{travellers.length}</h3>
          <p className="text-xs text-gray-400 mt-1">Active participants</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Equal Share / Person</span>
            <DollarSign size={18} className="text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-purple-700 mt-1">${equalSplitShare.toFixed(2)}</h3>
          <p className="text-xs text-gray-400 mt-1">Target split per person</p>
        </div>
      </div>

      {/* Add Traveller Form Modal/Collapsible */}
      {showAddTraveller && (
        <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-6 transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            Invite a Friend to Trip
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter the email address of the traveler you wish to include in this trip.
          </p>

          {travellerError && (
            <div className="mb-4">
              <ErrorBanner message={travellerError} />
            </div>
          )}

          <form onSubmit={handleAddTraveller} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label=""
                id="traveller-email"
                type="email"
                value={travellerEmail}
                onChange={(e) => setTravellerEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={submittingTraveller}>
                {submittingTraveller ? 'Sending...' : 'Invite'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAddTraveller(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Section 1: Travellers and Paid Amounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Traveller Spending & Balances</h2>
            <p className="text-xs text-gray-500">Track total contributed vs expected split.</p>
          </div>
        </div>

        {travellers.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No Travellers Added"
              description="Invite friends or companions to automatically divide costs evenly."
            />
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => setShowAddTraveller(true)}>
                <span className="flex items-center gap-2">
                  <UserPlus size={18} /> Invite Traveller
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6 text-right">Total Paid</th>
                  <th className="py-3.5 px-6 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {travellersWithBalances.map((t) => (
                  <tr key={t.id || t.email} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">
                      {t.name || t.email.split('@')[0]}
                    </td>
                    <td className="py-3.5 px-6 text-gray-500 text-xs">{t.email}</td>
                    <td className="py-3.5 px-6 font-medium text-right text-gray-900">
                      ${t.paid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      {t.balance >= 0 ? (
                        <span className="inline-flex items-center font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                          +${t.balance.toFixed(2)} (Gets Back)
                        </span>
                      ) : (
                        <span className="inline-flex items-center font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full text-xs">
                          -${Math.abs(t.balance).toFixed(2)} (Owes)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Calculated Debts (Who owes whom) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Calculated Split Breakdown</h2>
        <p className="text-sm text-gray-500 mb-4">
          Automated distribution to settle all balances with minimal transactions.
        </p>

        {computedDebts.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
            <p className="text-gray-700 font-semibold text-sm">All balances are settled!</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Everyone has contributed an equal share or no expenses have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {computedDebts.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{item.debtorName}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    owes
                    <ArrowRight size={14} className="text-primary" />
                  </div>
                  <span className="font-bold text-gray-900">{item.creditorName}</span>
                </div>
                <div className="text-lg font-extrabold text-primary">
                  ${item.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Registered Settlements Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recorded Settlements</h2>
            <p className="text-xs text-gray-500">Official settlement records and payment confirmations.</p>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No Recorded Settlements"
              description="Click 'Auto-Generate Settlements' above to save the calculated split records to this trip."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {settlements.map((settlement) => {
              const settleId = settlement.id || settlement._id;
              const isSettled = settlement.status === 'settled';
              const debtor =
                settlement.fromUser?.name ||
                settlement.fromUser?.email ||
                settlement.debtor ||
                settlement.from ||
                'Traveler';
              const creditor =
                settlement.toUser?.name ||
                settlement.toUser?.email ||
                settlement.creditor ||
                settlement.to ||
                'Traveler';
              const amount = Number(settlement.amount || 0);

              return (
                <div
                  key={settleId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSettled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {isSettled ? <Check size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {debtor} pays {creditor}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Amount: <strong className="text-gray-900">${amount.toFixed(2)}</strong> • Status:{' '}
                        <span
                          className={`font-semibold capitalize ${
                            isSettled ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {settlement.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {!isSettled ? (
                      <Button
                        variant="primary"
                        onClick={() => handleMarkAsSettled(settleId)}
                        disabled={settlingId === settleId}
                      >
                        <span className="flex items-center gap-1.5 text-xs">
                          <Check size={14} />
                          {settlingId === settleId ? 'Marking...' : 'Mark as Settled'}
                        </span>
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <Check size={14} /> Settled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
