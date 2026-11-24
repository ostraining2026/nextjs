import UsersTable from "../../components/UsersTable";

export const metadata = { title: "Manage Users" };

export default function UsersPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Manage Users</h1>
      <UsersTable />
    </>
  );
}
