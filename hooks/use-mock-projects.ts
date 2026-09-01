"use client"

import { useCallback, useMemo, useState } from "react"

import { MOCK_PROJECTS } from "@/lib/mock-projects"
import type { Project, ProjectDialogIntent } from "@/types/project"

interface MockProjects {
  ownedProjects: Project[]
  sharedProjects: Project[]
  applyIntent: (intent: ProjectDialogIntent) => void
}

/**
 * In-memory project list for the editor shell.
 *
 * Temporary scaffolding: it holds the mock projects in component state so the
 * wired dialogs visibly do something, and is replaced wholesale by real data
 * fetching in the persistence chapter. Nothing here is persisted — a reload
 * restores the original mock list.
 */
function useMockProjects(): MockProjects {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)

  const applyIntent = useCallback((intent: ProjectDialogIntent) => {
    setProjects((current) => {
      switch (intent.kind) {
        case "create":
          return [
            {
              id: crypto.randomUUID(),
              name: intent.name,
              slug: intent.slug,
              role: "owner",
            },
            ...current,
          ]
        case "rename":
          return current.map((project) =>
            project.id === intent.project.id
              ? { ...project, name: intent.name, slug: intent.slug }
              : project
          )
        case "delete":
          return current.filter((project) => project.id !== intent.project.id)
      }
    })
  }, [])

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.role === "owner"),
    [projects]
  )

  const sharedProjects = useMemo(
    () => projects.filter((project) => project.role === "collaborator"),
    [projects]
  )

  return { ownedProjects, sharedProjects, applyIntent }
}

export { useMockProjects }
