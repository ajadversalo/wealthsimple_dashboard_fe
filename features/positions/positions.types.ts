export interface OptionLeg {
  contract_symbol: string;
  option_type: 'PUT' | 'CALL';
  strike_price: number;
  expiration_date: string;
  quantity: number;
  avg_price: number;
  moneyness: string;
}

export interface Underlying {
  shares: number;
  avg_purchase_price: number;
}

export interface CurrencyAmount {
  usd: number;
  cad: number;
}

export interface BrokerSummary {
  broker: string;
  net_value: CurrencyAmount;
  option_liabilities: CurrencyAmount;
  remaining_capital: CurrencyAmount;
  deployed_capital: CurrencyAmount;
  total_capital: CurrencyAmount;
}

export interface BrokerTotals {
  WEALTHSIMPLE: BrokerSummary;
  KRAKEN: BrokerSummary;
  [broker: string]: BrokerSummary;
}

export type PositionStrategy =
  | 'CASH_SECURED_PUT'
  | 'COVERED_CALL'
  | 'LONG_EQUITY';

export interface Position {
  symbol: string;
  broker: string;
  asset_class: string;
  strategy: PositionStrategy;
  industry: string;
  current_price: number;
  portfolio_pct: number;
  underlying: Underlying | null;
  option_leg: OptionLeg | null;
}

export interface Sector {
  industry: string;
  capital_committed: number;
  portfolio_pct: number;
  tickers: string[];
}

export interface PositionsPayload {
  account_id: string;
  updated_at: string;
  fx_rate_usd_cad: number;
  total_capital: CurrencyAmount;
  remaining_capital: CurrencyAmount;
  positions: Position[];
  sectors: Sector[];
  broker_totals: BrokerTotals;
}
