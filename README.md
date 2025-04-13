This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

---

## DataTable Component

A flexible, reusable table component supporting both client-side and server-side pagination, filtering, sorting, and search, with a built-in loading skeleton.

### Features

- Generic and type-safe for any data shape
- Client-side and server-side modes (toggle with a single prop)
- Pagination, filtering, sorting, and search
- Mobile and desktop responsive layouts
- Customizable toolbar, batch actions, and row actions
- Loading skeleton for async/server-side data fetching
- Backward compatible with previous client-side usage

### Props

| Prop            | Type                                      | Required | Description                                                                 |
|-----------------|-------------------------------------------|----------|-----------------------------------------------------------------------------|
| data            | TData[]                                   | Yes      | Data to display (current page if server-side, full array if client-side)     |
| columns         | ColumnDef<TData>[]                        | Yes      | Table columns (TanStack Table format)                                       |
| serverSide      | boolean                                   | No       | Enables server-side mode (default: false)                                   |
| state           | {pagination, filters, sorting, search}    | No       | Controlled state for server-side mode                                       |
| onStateChange   | (state) => void                           | No       | State change handler for server-side mode                                   |
| loading         | boolean                                   | No       | Show loading skeleton when true                                             |
| ...             | ...other props (toolbar, actions, etc.)   | No       | See source for full list                                                    |

### Usage

#### Client-side (default)

```tsx
<DataTable
  data={allData}
  columns={columns}
/>
```

#### Server-side

```tsx
const [tableState, setTableState] = useState({
  pagination: { pageIndex: 0, pageSize: 10 },
  filters: [],
  sorting: [],
  search: "",
});
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchServerData(tableState).then(newData => {
    setData(newData);
    setLoading(false);
  });
}, [tableState]);

<DataTable
  data={data}
  columns={columns}
  serverSide
  state={tableState}
  onStateChange={setTableState}
  loading={loading}
/>
```

### Loading Skeleton

When the `loading` prop is true, the table displays animated skeleton rows using the `Skeleton` component from `src/components/ui/skeleton.tsx`. This provides a smooth user experience during async data fetching.

### Backward Compatibility

If `serverSide` is not set, the DataTable behaves exactly as before, using internal state for all features. All existing usages remain valid.

### More

See the source code in `src/components/data-table/data-table.tsx` for advanced usage, customization, and extension points.
