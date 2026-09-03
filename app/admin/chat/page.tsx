/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ChatClient from "./components/ChatClient"

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="lg:mt-0 mt-16">
        <div className="text-white">Giriş yapmalısınız</div>
      </div>
    )
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