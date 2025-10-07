import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:8085/expensebackend/api";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [people, setPeople] = useState([]);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    paidById: "",
    participants: "",
  });

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    try {
      const [eRes, pRes, bRes, sRes] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/people`),
        fetch(`${API}/balances`),
        fetch(`${API}/settle`),
      ]);

      if (!eRes.ok || !pRes.ok) {
        throw new Error("Backend fetch error");
      }

      const [expensesJson, peopleJson, balancesJson, settleJson] = await Promise.all([
        eRes.json(),
        pRes.json(),
        bRes.ok ? bRes.json() : {},
        sRes.ok ? sRes.json() : [],
      ]);

      setExpenses(expensesJson || []);
      setPeople(peopleJson || []);
      setBalances(balancesJson || {});
      setSettlements(settleJson || []);
    } catch (err) {
      console.error(err);
      // small user-visible message
      // (keep it non-intrusive for demo)
    }
  }

  async function addExpense() {
    if (!form.amount || isNaN(Number(form.amount))) {
      alert("Please enter a valid amount");
      return;
    }

    const body = {
      title: form.title || "New Expense",
      amount: Number(form.amount),
      // **Important**: backend expects ExpenseRequest with paidById and participantIds
      paidById: form.paidById ? Number(form.paidById) : (people[0] ? people[0].id : null),
      participantIds:
        form.participants && form.participants.trim().length > 0
          ? form.participants
          : people.map((p) => p.id).join(","),
    };

    if (!body.paidById) {
      alert("Please add a person first (use + Add Person).");
      return;
    }

    try {
      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to add expense");
      }
      setForm({ title: "", amount: "", paidById: "", participants: "" });
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Add expense failed: " + (e.message || "unknown error"));
    }
  }

  async function addPerson() {
    const name = prompt("New person name:");
    if (!name) return;
    try {
      const res = await fetch(`${API}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to add person");
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("Add person failed: " + (e.message || "unknown error"));
    }
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const myShare = balances["Kiran"] ?? 0; // example current user = Kiran (seeded)

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={cardStyle}>
          <h3>Total Expenses</h3>
          <p style={{ fontSize: 22, fontWeight: 700 }}>₹{total}</p>
        </div>
        <div style={cardStyle}>
          <h3>Your Share</h3>
          <p style={{ fontSize: 20, fontWeight: 700 }}>
            {myShare > 0 ? `+₹${myShare}` : `₹${myShare}`}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4>Recent Transactions</h4>
          <ul>
            {expenses.slice().reverse().map((e) => (
              <li key={e.id}>
                {e.title} — ₹{e.amount} (Paid by {e.paidBy?.name ?? "Unknown"})
              </li>
            ))}
          </ul>
        </div>

        <div style={{ ...cardStyle, width: 360 }}>
          <h4>Add Expense</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(ev) => setForm({ ...form, title: ev.target.value })}
            />
            <input
              placeholder="Amount"
              value={form.amount}
              onChange={(ev) => setForm({ ...form, amount: ev.target.value })}
            />
            <select
              value={form.paidById}
              onChange={(ev) => setForm({ ...form, paidById: ev.target.value })}
            >
              <option value="">-- Paid by --</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Participant IDs (comma separated). leave empty = all"
              value={form.participants}
              onChange={(ev) => setForm({ ...form, participants: ev.target.value })}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addExpense}>➕ Add Expense</button>
              <button onClick={addPerson}>+ Add Person</button>
              <button onClick={fetchAll}>↻ Refresh</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4>Balances</h4>
          <ul>
            {Object.entries(balances).map(([name, value]) => (
              <li key={name}>
                {name}: {value > 0 ? `+₹${value}` : `₹${value}`}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ ...cardStyle, width: 360 }}>
          <h4>Suggested Settlements</h4>
          <ol>
            {settlements.map((s, idx) => (
              <li key={idx}>
                {s.from} → {s.to}: ₹{s.amount}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(250, 247, 247, 1)",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

export default Dashboard;
