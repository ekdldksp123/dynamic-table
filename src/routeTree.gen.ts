/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as ReportsIndexImport } from './routes/reports/index'
import { Route as ReportsReportIdIndexImport } from './routes/reports/$reportId/index'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const ReportsIndexRoute = ReportsIndexImport.update({
  path: '/reports/',
  getParentRoute: () => rootRoute,
} as any)

const ReportsReportIdIndexRoute = ReportsReportIdIndexImport.update({
  path: '/reports/$reportId/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/reports/': {
      id: '/reports/'
      path: '/reports'
      fullPath: '/reports'
      preLoaderRoute: typeof ReportsIndexImport
      parentRoute: typeof rootRoute
    }
    '/reports/$reportId/': {
      id: '/reports/$reportId/'
      path: '/reports/$reportId'
      fullPath: '/reports/$reportId'
      preLoaderRoute: typeof ReportsReportIdIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexLazyRoute,
  ReportsIndexRoute,
  ReportsReportIdIndexRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/reports/",
        "/reports/$reportId/"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/reports/": {
      "filePath": "reports/index.tsx"
    },
    "/reports/$reportId/": {
      "filePath": "reports/$reportId/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
