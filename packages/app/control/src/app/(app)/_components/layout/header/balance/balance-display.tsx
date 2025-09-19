'use client';

import { api } from '@/trpc/client';

import { formatCurrency } from '@/services/user/balance';

export const Balance = () => {
  const [balance] = api.user.balance.get.useSuspenseQuery();

  return (
    <span className="text-sm font-extrabold text-foreground">
      {formatCurrency(Number(balance?.balance) || 0)}
    </span>
  );
};
