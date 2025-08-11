import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'

export default function DeepAgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NuqsAdapter>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </NuqsAdapter>
  )
}