# Ticket Template — BudgetWise

This is the canonical format for BudgetWise tickets. Fill in all applicable sections; omit sections that don't apply (e.g., no "API Endpoints" for frontend-only work). Always include the metadata block and Acceptance Criteria.

---

```markdown
# Ticket XX — [Feature Name]

**Phase:** [e.g., Post-Phase 3]
**Priority:** High / Medium / Low
**Depends on:** Ticket NN ([name]), Ticket NN ([name]) / Nothing
**Blocks:** Ticket NN ([name]) / Nothing

---

## Objective

[1–3 sentence description of what this ticket builds and why. State what will exist after this ticket is complete that didn't exist before.]

---

## [What the Page Shows] ← INCLUDE for new UI pages

```
┌─────────────────────────────────────────┐
│  Page Title                 [+ Add Btn]  │
├─────────────────────────────────────────┤
│                                          │
│  [ASCII wireframe of the main content]   │
│                                          │
└─────────────────────────────────────────┘
```

### Table Columns / Card Fields (describe UI structure)

| Column  | Content |
|---------|---------|
| ...     | ...     |

### Dialog (if applicable)

[Describe add/edit dialog fields, validation, pre-fill behavior]

### Delete Confirmation

Use `ConfirmDialogComponent`. Title: "Delete [Entity]". Message: "Are you sure..."

---

## [Responsive Behavior] ← INCLUDE for new UI pages

### Desktop (≥ 600px)
- [Describe desktop layout]

### Mobile (< 600px)
- [Describe mobile layout — list rows instead of table, FAB instead of header button, etc.]

---

## [Navigation] ← INCLUDE if adding a sidenav link

Add a **"[Label]"** link to the sidenav in `app.html`:
- **Icon:** `[material-icon-name]`
- **Label:** "[Label]"
- **Route:** `/[route]`
- **Position:** After "[existing link]"

---

## [Routing] ← INCLUDE if adding a new page

Add to `budgetwise-ui/src/app/app.routes.ts`:

```typescript
{
  path: '[route]',
  title: '[Page Title]',
  loadComponent: () =>
    import('./pages/[folder]/[name].component').then(m => m.[Name]Component),
}
```

---

## Backend Changes ← INCLUDE for backend work

### `budgetwise-api/src/[module]/dto/create-[entity].dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class Create[Entity]Dto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}
```

### `budgetwise-api/src/[module]/[module].service.ts`

```typescript
async create(dto: Create[Entity]Dto): Promise<[Entity]> {
  return this.prisma.[model].create({ data: dto });
}

async findAll(): Promise<[Entity][]> {
  return this.prisma.[model].findMany({ orderBy: { createdAt: 'desc' } });
}

async findOne(id: string): Promise<[Entity]> {
  const item = await this.prisma.[model].findUnique({ where: { id } });
  if (!item) throw new NotFoundException(`[Entity] ${id} not found`);
  return item;
}

async update(id: string, dto: Update[Entity]Dto): Promise<[Entity]> {
  await this.findOne(id); // throws if not found
  return this.prisma.[model].update({ where: { id }, data: dto });
}

async remove(id: string): Promise<void> {
  await this.findOne(id);
  try {
    await this.prisma.[model].delete({ where: { id } });
  } catch (e) {
    if (e.code === 'P2003') throw new ConflictException('Cannot delete: referenced by other records');
    throw e;
  }
}
```

### `budgetwise-api/src/[module]/[module].controller.ts`

```typescript
@Post()
create(@Body() dto: Create[Entity]Dto) {
  return this.service.create(dto);
}

@Get()
findAll() {
  return this.service.findAll();
}

@Get(':id')
findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

@Patch(':id')
update(@Param('id') id: string, @Body() dto: Update[Entity]Dto) {
  return this.service.update(id, dto);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.service.remove(id);
}
```

### [API Endpoints] ← INCLUDE for new API routes

| Method | Route | Body / Params | Response |
|--------|-------|---------------|----------|
| POST   | `/api/[resource]` | `Create[Entity]Dto` | Created entity |
| GET    | `/api/[resource]` | — | `[Entity][]` |
| GET    | `/api/[resource]/:id` | `:id` | `[Entity]` or 404 |
| PATCH  | `/api/[resource]/:id` | `Update[Entity]Dto` | Updated entity |
| DELETE | `/api/[resource]/:id` | `:id` | 204 No Content |

---

## Frontend Changes ← INCLUDE for frontend work

### `budgetwise-ui/src/app/core/services/[entity].service.ts` ← if new service needed

```typescript
@Injectable({ providedIn: 'root' })
export class [Entity]Service {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/[resource]`;

  getAll(): Observable<[Entity][]> {
    return this.http.get<[Entity][]>(this.base);
  }
  create(dto: Partial<[Entity]>): Observable<[Entity]> {
    return this.http.post<[Entity]>(this.base, dto);
  }
  update(id: string, dto: Partial<[Entity]>): Observable<[Entity]> {
    return this.http.patch<[Entity]>(`${this.base}/${id}`, dto);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

### `budgetwise-ui/src/app/pages/[folder]/[name].component.ts`

```typescript
@Component({
  selector: 'app-[name]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    // add other Material modules as needed
  ],
  templateUrl: './[name].component.html',
  styleUrl: './[name].component.scss',
})
export class [Name]Component implements OnInit {
  private service = inject([Entity]Service);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  items: [Entity][] = [];
  isLoading = true;
  isMobile = false;
  displayedColumns = ['name', 'actions'];

  ngOnInit() {
    this.breakpointObserver.observe(Breakpoints.Handset).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.load();
  }

  load() {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: items => { this.items = items; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  openDialog(item?: [Entity]) {
    const ref = this.dialog.open([Entity]DialogComponent, { data: item, width: '400px' });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  delete(item: [Entity]) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete [Entity]', message: `Are you sure you want to delete **${item.name}**? This cannot be undone.` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(item.id).subscribe({
        next: () => { this.snackBar.open('[Entity] deleted', 'Close', { duration: 3000 }); this.load(); },
        error: (e) => {
          const msg = e.status === 409 ? 'Cannot delete: referenced by other records.' : 'Delete failed.';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        },
      });
    });
  }
}
```

---

## Implementation Notes

- [Specific gotcha 1 — e.g., "The `CategoriesService` is already exported from `CategoriesModule` — import that module, don't create a new service"]
- [Specific gotcha 2 — e.g., "Reload the list after every mutation — don't try to patch the local array"]
- [Pattern reminder — e.g., "Use Prisma `$transaction` for atomic balance updates"]

---

## Files to Create

```
[list all new files with their full relative paths from the repo root]
budgetwise-api/src/[module]/dto/create-[entity].dto.ts
budgetwise-ui/src/app/pages/[folder]/[name].component.ts
budgetwise-ui/src/app/pages/[folder]/[name].component.html
budgetwise-ui/src/app/pages/[folder]/[name].component.scss
```

## Files to Modify

- `budgetwise-ui/src/app/app.routes.ts` — add `[route]` route
- `budgetwise-ui/src/app/app.html` — add sidenav link
- `budgetwise-api/src/app.module.ts` — import new module (if new backend module)

---

## Acceptance Criteria

- [ ] [Specific, independently verifiable criterion — what a tester can check without reading the rest of the ticket]
- [ ] [Another criterion]
- [ ] [Another criterion — include API-level checks for backend work, e.g., "POST /api/[resource] returns 201 with the created entity"]
- [ ] [UI criterion — e.g., "Empty state message shows when the list is empty"]
- [ ] [Responsive criterion — e.g., "Mobile view (<600px) shows list rows; desktop shows mat-table"]
- [ ] [Error handling criterion — e.g., "Deleting a [entity] used by [other] shows specific FK error snackbar"]
```
