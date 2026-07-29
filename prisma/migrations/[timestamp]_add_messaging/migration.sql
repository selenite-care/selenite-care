CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lastMessage" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_clientId_key" 
ON "Conversation"("clientId");

DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('TEXT', 'LINK', 'IMAGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "isReadByClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" 
ON "Message"("conversationId", "createdAt" ASC);

CREATE INDEX IF NOT EXISTS "Message_senderId_idx" 
ON "Message"("senderId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_clientId_fkey') THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_conversationId_fkey') THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
            FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_senderId_fkey') THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
            FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;