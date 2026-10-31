/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChatClient from "./components/ChatClient"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const session = await auth()
  const userRole = session?.user?.role
  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  if (!session?.user || (!tenantId && !isSuperAdmin)) {
    redirect("/login")
  }

  // Fetch conversations for the current user
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-0">
      <ChatClient 
        currentUser={session.user} 
        initialConversations={conversations} 
      />
    </div>
  )
}