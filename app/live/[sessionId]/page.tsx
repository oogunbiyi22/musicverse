import LiveSession from '@/components/LiveSession'

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Live Listening Session</h1>
      <LiveSession sessionId={sessionId} />
    </div>
  )
}
