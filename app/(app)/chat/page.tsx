import ChatView from "../../components/ChatView";

export const metadata = { title: "Group Chat" };

export default function ChatPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Group Chat</h1>
      <ChatView />
    </>
  );
}
