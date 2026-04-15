import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

interface HelpQuestion {
  readonly question: string;
  readonly answer: string;
}

interface HelpSection {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly HelpQuestion[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent {
  readonly sections: readonly HelpSection[] = [
    {
      icon: 'rocket_launch',
      title: 'Getting Started',
      description: 'Set up your workspace, learn the layout, and understand what to do first.',
      items: [
        {
          question: 'How do I start using BudgetWise after signing in?',
          answer:
            'Begin on the dashboard, then head to Accounts to add the bank accounts, e-wallets, and cash balances you want to track. Once your accounts are in place, you can start recording transactions and setting budgets.',
        },
        {
          question: 'What does the onboarding tutorial cover?',
          answer:
            'The first-time tour points you to the dashboard, accounts, transactions, budgets, and the AI advisor so you can learn the key flows in a minute or two.',
        },
        {
          question: 'Do I need to finish setup before exploring the app?',
          answer:
            'No. You can skip the tour, browse any page, and come back to setup when you are ready. The app works best once you have at least one account and a few transactions recorded.',
        },
      ],
    },
    {
      icon: 'account_balance_wallet',
      title: 'Accounts',
      description: 'Manage the places where your money lives so reports and balances stay accurate.',
      items: [
        {
          question: 'Which account types can I add?',
          answer:
            'You can add cash, bank, e-wallet, credit card, and loan accounts. Choose the type that best matches the real-world account you want to track.',
        },
        {
          question: 'Can I set an opening balance?',
          answer:
            'Yes. BudgetWise records non-zero opening balances as adjustment transactions so you keep a visible audit trail instead of silently changing balances behind the scenes.',
        },
        {
          question: 'Why does an account balance change after I save a transaction?',
          answer:
            'Every income, expense, and transfer updates the linked account automatically. That keeps your account totals and dashboard summary in sync with your transaction history.',
        },
      ],
    },
    {
      icon: 'receipt_long',
      title: 'Transactions',
      description: 'Track cash flow, categorize activity, and understand how entries affect your totals.',
      items: [
        {
          question: 'How do I log income and expenses?',
          answer:
            'Open the Transactions page and create a new entry. Select the right account, category, amount, and date, then save it to update your balances and reports immediately.',
        },
        {
          question: 'What is a transfer transaction?',
          answer:
            'Transfers move money between two of your own accounts. They affect account balances but do not count as spending or income in reports.',
        },
        {
          question: 'Can I export my transactions?',
          answer:
            'Yes. The Transactions page includes a CSV export action that downloads the rows matching your current filters so you can review or share your data elsewhere.',
        },
      ],
    },
    {
      icon: 'savings',
      title: 'Budgets',
      description: 'Plan monthly spending by category and keep an eye on how close you are to each limit.',
      items: [
        {
          question: 'How do monthly budgets work?',
          answer:
            'Each budget belongs to one category and one month. BudgetWise compares your actual spending with the amount you set, then shows progress and over-budget warnings on the dashboard and reports pages.',
        },
        {
          question: 'What does spillover mean?',
          answer:
            'Spillover lets unused budget carry forward from prior months when those earlier budget rows also have spillover enabled. It gives you an effective budget that can be larger than the base amount.',
        },
        {
          question: "Can I copy last month's budgets?",
          answer:
            "Yes. The Budgets page includes a copy flow that previews last month's categories and lets you bring forward selected entries without overwriting budgets you already created this month.",
        },
      ],
    },
    {
      icon: 'event_repeat',
      title: 'Scheduled Transactions',
      description: 'Automate recurring entries and stay ahead of upcoming bills or paydays.',
      items: [
        {
          question: 'What are scheduled transactions used for?',
          answer:
            'Use them for recurring bills, income, subscriptions, and one-time future entries. They help you plan ahead without manually retyping the same transaction every month.',
        },
        {
          question: 'Will scheduled transactions create real entries automatically?',
          answer:
            'Yes. Due scheduled transactions can generate real transactions and stay linked back to the source template so you can see where they came from.',
        },
        {
          question: 'Can BudgetWise remind me before something is due?',
          answer:
            'Yes. Scheduled transactions support reminders, and the app surfaces those notifications in the bell menu so you can act before the due date arrives.',
        },
      ],
    },
    {
      icon: 'smart_toy',
      title: 'AI Chat',
      description: 'Get quick answers, insights, and guided help from the built-in financial assistant.',
      items: [
        {
          question: 'What can the AI advisor help with?',
          answer:
            'The AI advisor can answer questions about your finances, summarize trends, help you understand budgets, and assist with supported finance-management actions through conversation.',
        },
        {
          question: 'Where do I open the AI chat?',
          answer:
            'Use the floating chat button in the lower-right corner of the app. It stays available across the authenticated experience so help is always close by.',
        },
        {
          question: 'Is the AI allowed to make destructive changes right away?',
          answer:
            'No. Destructive actions require explicit confirmation, which adds a safety step before anything irreversible is carried out on your data.',
        },
      ],
    },
  ];
}
