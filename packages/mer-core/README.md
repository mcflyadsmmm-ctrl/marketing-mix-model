# @mcfly/mer-core

Cash MER math and rules-based channel allocation for Mcfly Analytics.

```ts
import { calculateMer, calculateBreakEvenMer, suggestAllocation } from "@mcfly/mer-core";

const mer = calculateMer(10000, 4000); // 2.5
const breakEven = calculateBreakEvenMer(0.4); // 2.5

const suggestion = suggestAllocation({
  channels: [
    { name: "Meta", spend: 3000 },
    { name: "Google", spend: 2000 },
    { name: "Manual / Other", spend: 500, isManual: true },
  ],
  breakEvenMer: 2.5,
  totalSales: 10000,
  totalSpend: 5500,
});
// suggestion.why, suggestion.actions, suggestion.suggestedTestDays (default 7)
```

No MTA or path attribution — period-level cash view only.
