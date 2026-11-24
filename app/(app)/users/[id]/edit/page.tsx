import EditUserForm from "../../../../components/EditUserForm";

export const metadata = { title: "Edit User" };

export default function EditUserPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Edit User</h1>
      <EditUserForm />
    </>
  );
}
