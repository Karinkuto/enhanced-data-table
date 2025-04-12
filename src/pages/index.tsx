"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, DefaultRowActions, categoryFilterFn, multiColumnFilterFn, type RowAction, type BatchAction } from "@/components/data-table/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash, FileText, Copy, Filter, Columns, RefreshCcw, FileDown, CheckSquare, UserX } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

type User = {
  id: string
  name: string
  email: string
  location: string
  flag: string
  status: "Active" | "Inactive" | "Pending"
  balance: number
  department?: string
  role?: string
  joinDate?: string
  performance?: "Excellent" | "Good" | "Average" | "Poor"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const res = await fetch("https://res.cloudinary.com/dlzlfasou/raw/upload/users-01_fertyx.json")
        const data = await res.json()

        // Add additional fields for the example
        const enhancedData = data.map((user: User) => ({
          ...user,
          department: ["Sales", "Marketing", "Engineering", "Support"][Math.floor(Math.random() * 4)],
          role: ["Director", "Manager", "Associate", "Specialist"][Math.floor(Math.random() * 4)],
          joinDate: new Date(
            2020 + Math.floor(Math.random() * 4),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          ).toLocaleDateString(),
          performance: ["Excellent", "Good", "Average", "Poor"][Math.floor(Math.random() * 4)],
        }))

        setUsers(enhancedData)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      size: 180,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Email",
      accessorKey: "email",
      size: 220,
    },
    {
      header: "Location",
      accessorKey: "location",
      cell: ({ row }) => (
        <div>
          <span className="text-lg leading-none">{row.original.flag}</span> {row.getValue("location")}
        </div>
      ),
      size: 180,
    },
    {
      header: "Department",
      accessorKey: "department",
      size: 150,
    },
    {
      header: "Role",
      accessorKey: "role",
      size: 150,
    },
    {
      header: "Join Date",
      accessorKey: "joinDate",
      size: 120,
    },
    {
      header: "Performance",
      accessorKey: "performance",
      cell: ({ row }) => {
        const performance = row.getValue("performance") as string
        let badgeClass = ""

        switch (performance) {
          case "Excellent":
            badgeClass = "bg-green-600 text-white"
            break
          case "Good":
            badgeClass = "bg-blue-600 text-white"
            break
          case "Average":
            badgeClass = "bg-yellow-600 text-white"
            break
          case "Poor":
            badgeClass = "bg-red-600 text-white"
            break
        }

        return <Badge className={badgeClass}>{performance}</Badge>
      },
      size: 120,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            className={cn(
              status === "Active" && "bg-green-600 text-white",
              status === "Inactive" && "bg-muted-foreground/60 text-primary-foreground",
              status === "Pending" && "bg-yellow-600 text-white",
            )}
          >
            {status}
          </Badge>
        )
      },
      size: 100,
      filterFn: categoryFilterFn,
    },
    {
      header: "Balance",
      accessorKey: "balance",
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("balance"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return formatted
      },
      size: 120,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <DefaultRowActions row={row} />,
      size: 60,
      enableHiding: false,
    },
  ]

  const handleDeleteUsers = (selectedUsers: User[]) => {
    setUsers(users.filter((user) => !selectedUsers.some((selected) => selected.id === user.id)))
  }

  const handleAddUser = () => {
    toast.success("Add user functionality would go here")
  }

  const rowActions: RowAction<User>[] = [
    {
      label: "View Details",
      icon: <FileText className="h-4 w-4" />,
      onClick: (user) => {
        toast.info(`Viewing details for ${user.name}`);
      }
    },
    {
      label: "Edit User",
      icon: <Edit className="h-4 w-4" />,
      onClick: (user) => {
        toast.info(`Editing ${user.name}`);
      }
    },
    {
      label: "Copy Info",
      icon: <Copy className="h-4 w-4" />,
      onClick: (user) => {
        navigator.clipboard.writeText(JSON.stringify(user, null, 2));
        toast.success(`Copied info for ${user.name}`);
      }
    },
    {
      label: "Delete",
      icon: <Trash className="h-4 w-4 text-destructive" />,
      onClick: (user) => {
        setUsers(users.filter(u => u.id !== user.id));
        toast.error(`Deleted ${user.name}`);
      }
    },
  ];

  const searchableColumns = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "location", label: "Location" },
    { id: "department", label: "Department" },
  ];

  // Define mobile batch actions with custom icons, labels and functionality
  const mobileBatchActions: BatchAction<User>[] = [
    {
      label: "Export to CSV",
      icon: <FileDown className="h-4 w-4" />,
      onClick: (selectedUsers) => {
        // Convert selected users to CSV format
        const headers = "Name,Email,Location,Status,Balance\n";
        const csv = selectedUsers.map(user => 
          `${user.name},${user.email},${user.location},${user.status},${user.balance}`
        ).join("\n");
        
        // Create and download file
        const blob = new Blob([headers + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported-users.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${selectedUsers.length} users to CSV`);
      }
    },
    {
      label: "Activate Users",
      icon: <CheckSquare className="h-4 w-4" />,
      onClick: (selectedUsers) => {
        // Update status of selected users
        setUsers(users.map(user => 
          selectedUsers.some(selected => selected.id === user.id)
            ? { ...user, status: "Active" }
            : user
        ));
        toast.success(`Activated ${selectedUsers.length} users`);
      }
    },
    {
      label: "Deactivate Users",
      icon: <UserX className="h-4 w-4" />,
      onClick: (selectedUsers) => {
        // Update status of selected users
        setUsers(users.map(user => 
          selectedUsers.some(selected => selected.id === user.id)
            ? { ...user, status: "Inactive" }
            : user
        ));
        toast.success(`Deactivated ${selectedUsers.length} users`);
      }
    },
    {
      label: "Delete Selected",
      icon: <Trash className="h-4 w-4 text-destructive" />,
      onClick: (selectedUsers) => {
        setUsers(users.filter(user => 
          !selectedUsers.some(selected => selected.id === user.id)
        ));
        toast.error(`Deleted ${selectedUsers.length} users`);
      }
    }
  ];

  // Define custom handlers for filter and column management
  const handleFilterClick = () => {
    setFilterModalOpen(true);
    toast.info("Filter dialog would open here");
    // Implementation would open a custom filter UI
  };

  const handleColumnsClick = () => {
    setColumnsModalOpen(true);
    toast.info("Column management dialog would open here");
    // Implementation would open column visibility controls
  };

  // Configure mobile view layout
  const mobileViewConfig = {
    headerColumnId: "name",
    subheaderColumnIds: ["email", "role", "status"],
    excludeFromDetailColumns: ["name", "email", "select", "actions"],
    columnLabels: {
      "performance": "Performance Rating",
      "joinDate": "Started On",
      "balance": "Account Balance",
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          {/* You can add a title or other content here if needed */}
        </div>
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onDeleteRows={handleDeleteUsers}
        onAddItem={handleAddUser}
        addButtonText="Add New"
        searchPlaceholder="Search users..."
        searchColumnId="name"
        initialPageSize={5}
        rowActions={rowActions}
        searchableColumns={searchableColumns}
        mobileViewConfig={mobileViewConfig}
        mobileBatchActions={mobileBatchActions}
        tableToolbarProps={{
          onFilter: handleFilterClick,
          onManageColumns: handleColumnsClick,
          filterText: "Filters",
          columnsText: "Columns",
          showFilterButton: true,
          showColumnsButton: true,
        }}
      />
    </div>
  )
}
