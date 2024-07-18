import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reports/')({
  component: () => (
    <>
      <div>Reports list</div>
      <div>1</div>
      <div>2</div>
      <div>3</div>
    </>
  )
})
