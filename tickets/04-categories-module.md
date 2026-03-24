# Ticket 04 — Categories Module (CRUD)

**Phase:** 2 — Core Features  
**Priority:** High  
**Depends on:** Ticket 01  
**Blocks:** Ticket 06 (Transactions), Ticket 07 (Budgets)

---

## Objective

Create the Categories module with full CRUD. Categories classify transactions (e.g., "Food & Dining", "Transport", "Salary").

---

## Tasks

### 1. Create Module, Service, Controller

```bash
nest generate module categories
nest generate service categories
nest generate controller categories
```

### 2. Create DTOs

**File: `src/categories/dto/create-category.dto.ts`**

```typescript
import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string; // emoji like '🍔'
}
```

**File: `src/categories/dto/update-category.dto.ts`**

```typescript
import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
```

### 3. Implement Service

```typescript
@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: dto });
    // Will throw on duplicate name due to @unique constraint
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<Category> {
    await this.findOne(id);
    // This will fail if transactions reference this category (onDelete: Restrict)
    // which is intentional — don't delete categories with transaction history
    return this.prisma.category.delete({ where: { id } });
  }
}
```

### 4. Implement Controller

Standard REST controller matching the Accounts pattern:

| Method | Endpoint              | Body / Params          |
|--------|-----------------------|------------------------|
| POST   | `/api/categories`     | `{ name, icon? }`      |
| GET    | `/api/categories`     | —                      |
| GET    | `/api/categories/:id` | —                      |
| PATCH  | `/api/categories/:id` | `{ name?, icon? }`     |
| DELETE | `/api/categories/:id` | —                      |

### 5. Register & Export

Export `CategoriesService` from the module — it will be needed by Transactions, Budgets, and Chat modules.

---

## Important Behavior

- **Unique name constraint:** Creating a category with a duplicate name should return a 409 Conflict. Handle the Prisma `P2002` error code and throw `ConflictException`.
- **Delete restriction:** Deleting a category that has transactions should return a 400 Bad Request with a message like "Cannot delete category with existing transactions. Reassign or delete them first." Handle the Prisma `P2003` foreign key error.

---

## Acceptance Criteria

- [ ] POST creates a category and returns it
- [ ] POST with a duplicate name returns 409 Conflict
- [ ] GET returns all categories sorted alphabetically
- [ ] GET /:id returns 404 if not found
- [ ] PATCH updates only provided fields
- [ ] DELETE succeeds for categories with no transactions
- [ ] DELETE fails with a clear error for categories that have transactions
- [ ] `CategoriesService` is exported from the module
