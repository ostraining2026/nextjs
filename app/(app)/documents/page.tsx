import DocumentsView from "../../components/DocumentsView";

export const metadata = { title: "Manage Documents" };

export default function DocumentsPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Manage Documents</h1>
      <DocumentsView />
    </>
  );
}
