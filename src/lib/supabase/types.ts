// Hand-written types matching supabase/migrations/0001_init.sql.
// Kept small on purpose; we don't use the full generated types.

export type ISODate = string; // yyyy-mm-dd
export type ISOTimestamp = string;

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: ISOTimestamp;
};

export type Income = {
  id: string;
  amount: number;
  source: string;
  received_on: ISODate;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type Expense = {
  id: string;
  amount: number;
  category_id: string | null;
  description: string;
  occurred_on: ISODate;
  subscription_id: string | null;
  created_at: ISOTimestamp;
};

export type Bill = {
  id: string;
  name: string;
  type: "emi" | "credit_card" | "loan" | "other";
  amount: number;
  due_day: number;
  start_on: ISODate;
  end_on: ISODate | null;
  autopay: boolean;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type BillPayment = {
  id: string;
  bill_id: string;
  amount: number;
  paid_on: ISODate;
  cycle_month: ISODate;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type Subscription = {
  id: string;
  name: string;
  amount_inr: number;
  native_currency: string;
  billing_day: number;
  category_id: string | null;
  active: boolean;
  last_charged_on: ISODate | null;
  icon: string | null;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type Venture = {
  id: string;
  name: string;
  description: string | null;
  my_percentage: number;
  status: "active" | "closed";
  started_on: ISODate;
  closed_on: ISODate | null;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type VentureParticipant = {
  id: string;
  venture_id: string;
  name: string;
  percentage: number;
  created_at: ISOTimestamp;
};

export type VentureContribution = {
  id: string;
  venture_id: string;
  contributor_kind: "me" | "participant";
  participant_id: string | null;
  amount: number;
  contributed_on: ISODate;
  linked_lending_id: string | null;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type Lending = {
  id: string;
  counterparty: string;
  direction: "lent" | "borrowed";
  amount: number;
  occurred_on: ISODate;
  venture_id: string | null;
  source: "manual" | "venture_auto";
  notes: string | null;
  created_at: ISOTimestamp;
};

export type LendingSettlement = {
  id: string;
  lending_id: string;
  amount: number;
  settled_on: ISODate;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type Investment = {
  id: string;
  name: string;
  type: "mf" | "stock" | "fd" | "rd" | "gold" | "crypto" | "other";
  platform: string | null;
  amount: number;
  invested_on: ISODate;
  notes: string | null;
  created_at: ISOTimestamp;
};

export type AppSetting = {
  key: string;
  value: string;
  updated_at: ISOTimestamp;
};

// Loose Database type for createClient<>
export type Database = {
  public: {
    Tables: {
      incomes: { Row: Income; Insert: Partial<Income>; Update: Partial<Income> };
      expense_categories: { Row: ExpenseCategory; Insert: Partial<ExpenseCategory>; Update: Partial<ExpenseCategory> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      bills: { Row: Bill; Insert: Partial<Bill>; Update: Partial<Bill> };
      bill_payments: { Row: BillPayment; Insert: Partial<BillPayment>; Update: Partial<BillPayment> };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> };
      ventures: { Row: Venture; Insert: Partial<Venture>; Update: Partial<Venture> };
      venture_participants: { Row: VentureParticipant; Insert: Partial<VentureParticipant>; Update: Partial<VentureParticipant> };
      venture_contributions: { Row: VentureContribution; Insert: Partial<VentureContribution>; Update: Partial<VentureContribution> };
      lendings: { Row: Lending; Insert: Partial<Lending>; Update: Partial<Lending> };
      lending_settlements: { Row: LendingSettlement; Insert: Partial<LendingSettlement>; Update: Partial<LendingSettlement> };
      investments: { Row: Investment; Insert: Partial<Investment>; Update: Partial<Investment> };
      app_settings: { Row: AppSetting; Insert: Partial<AppSetting>; Update: Partial<AppSetting> };
    };
    Views: {
      v_balance: { Row: { balance_paise: number } };
    };
  };
};
