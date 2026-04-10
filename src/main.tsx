import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './Layout.tsx'
import App from './App.tsx'
import DatesPage from './pages/DatesPage.tsx'
import LinksPage from './pages/LinksPage.tsx'
import QuizPage from './pages/QuizPage.tsx'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <App /> },
        { path: 'dates', element: <DatesPage /> },
        { path: 'links', element: <LinksPage /> },
        { path: 'quiz', element: <QuizPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
