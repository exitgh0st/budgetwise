import { AccountType } from '../models/account.model';

export interface AccountProvider {
  id: string;
  name: string;
  logoPath: string;
  types: AccountType[];
}

const BANK_LOAN_TYPES: AccountType[] = ['BANK', 'CREDIT_CARD', 'LOAN'];

export const ACCOUNT_PROVIDERS: AccountProvider[] = [
  {
    id: 'bdo',
    name: 'BDO Unibank',
    logoPath: 'assets/providers/bdo.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'bpi',
    name: 'BPI',
    logoPath: 'assets/providers/bpi.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'metrobank',
    name: 'Metrobank',
    logoPath: 'assets/providers/metrobank.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'unionbank',
    name: 'UnionBank',
    logoPath: 'assets/providers/unionbank.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'securitybank',
    name: 'Security Bank',
    logoPath: 'assets/providers/securitybank.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'rcbc',
    name: 'RCBC',
    logoPath: 'assets/providers/rcbc.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'pnb',
    name: 'PNB',
    logoPath: 'assets/providers/pnb.svg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'landbank',
    name: 'Landbank',
    logoPath: 'assets/providers/landbank.svg',
    types: ['BANK', 'LOAN'],
  },
  {
    id: 'dbp',
    name: 'DBP',
    logoPath: 'assets/providers/dbp.svg',
    types: ['BANK', 'LOAN'],
  },
  {
    id: 'eastwestbank',
    name: 'EastWest Bank',
    logoPath: 'assets/providers/eastwestbank.png',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'chinabank',
    name: 'China Bank',
    logoPath: 'assets/providers/chinabank.jpeg',
    types: BANK_LOAN_TYPES,
  },
  {
    id: 'gcash',
    name: 'GCash',
    logoPath: 'assets/providers/gcash.svg',
    types: ['EWALLET'],
  },
  {
    id: 'maya',
    name: 'Maya',
    logoPath: 'assets/providers/maya.svg',
    types: ['EWALLET'],
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    logoPath: 'assets/providers/shopeepay.jpeg',
    types: ['EWALLET'],
  },
  {
    id: 'grabpay',
    name: 'GrabPay',
    logoPath: 'assets/providers/grabpay.svg',
    types: ['EWALLET'],
  },
  {
    id: 'coins',
    name: 'Coins.ph',
    logoPath: 'assets/providers/coins.svg',
    types: ['EWALLET'],
  },
  {
    id: 'homecredit',
    name: 'Home Credit',
    logoPath: 'assets/providers/homecredit.svg',
    types: ['LOAN'],
  },
];

export function getProvidersForType(type: AccountType): AccountProvider[] {
  return ACCOUNT_PROVIDERS.filter((provider) => provider.types.includes(type));
}

export function getProviderById(
  id: string | null | undefined,
): AccountProvider | undefined {
  if (!id) {
    return undefined;
  }

  return ACCOUNT_PROVIDERS.find((provider) => provider.id === id);
}
