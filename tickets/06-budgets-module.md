# Ticket 06 — Budgets Module (CRUD)

**Phase:** 2 — Core Features  
**Priority:** High  
**Depends on:** Ticket 04 (Categories)  
**Blocks:** Ticket 07 (Reports), Ticket 12 (Frontend Budgets page)

---

## Objective

Create the Budgets module with full CRUD. A budget sets a monthly spending limit for a specific category. Each category can have one budget per month.

---

## Tasks

### 1. Create Module, Service, Controller

```bash
nest generate module budgets
nest generate service budgets
nest generate controller budgets
```

### 2. Create DTOs

**File: `src/budgets/dto/create-budget.dto.ts`**

```typescript
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  categoryId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number; // defaults to current month

  @IsOptional()
  @IsNumber()
  year?: number; // defaults to current year
}
```

**File: `src/budgets/dto/update-budget.dto.ts`**

```typescript
import { IsNumber, Min } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}
```

**File: `src/budgets/dto/filter-budgets.dto.ts`**

```typescript
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterBudgetsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;
}
```

### 3. Implement Service

```typescript
@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);

    const now = new Date();
    const month = dto.month ?? now.getMonth() + 1; // JS months are 0-indexed
    const year = dto.year ?? now.getFullYear();

    // Upsert: if budget already exists for this category+month+year, update it
    return this.prisma.budget.upsert({
      where: {
        categoryId_month_year: {
          categoryId: dto.categoryId,
          month,
          year,
        },
      },
      update: { amount: dto.amount },
      create: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        month,
        year,
      },
      include: { category: true },
    });
  }

  async findAll(month?: number, year?: number) {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto) {
    await this.findOne(id);
    return this.prisma.budget.update({
      where: { id },
      data: { amount: dto.amount },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.budget.delete({ where: { id } });
  }
}
```

### 4. Implement Controller

```typescript
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: FilterBudgetsDto) {
    return this.budgetsService.findAll(filters.month, filters.year);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }
}
```

### 5. Register & Export

Export `BudgetsService` from the module.

---

## Key Behavior

- **Upsert on create:** If a budget already exists for the same category+month+year, the `create` method updates it instead of throwing a duplicate error. This simplifies both the UI and the AI agent.
- **Month/year default:** If not provided, defaults to the current month and year.
- **Only `amount` is updatable** via PATCH. To change the category or month, delete and recreate.

---

## API Endpoints

| Method | Endpoint           | Body / Params                                |
|--------|--------------------|----------------------------------------------|
| POST   | `/api/budgets`     | `{ categoryId, amount, month?, year? }`      |
| GET    | `/api/budgets`     | Query: `month?`, `year?`                     |
| GET    | `/api/budgets/:id` | —                                            |
| PATCH  | `/api/budgets/:id` | `{ amount }`                                 |
| DELETE | `/api/budgets/:id` | —                                            |

---

## Acceptance Criteria

- [ ] POST creates a budget linked to a valid category
- [ ] POST with an existing category+month+year updates the amount (upsert)
- [ ] POST defaults to current month/year when not provided
- [ ] POST with invalid categoryId returns 404
- [ ] GET with `?month=3&year=2026` returns only March 2026 budgets
- [ ] GET without filters returns all budgets
- [ ] All responses include the related `category` object
- [ ] PATCH only accepts `amount`
- [ ] DELETE removes the budget
- [ ] `BudgetsService` is exported
