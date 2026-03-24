-- CreateTable
CREATE TABLE "USERS" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USERS_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ORDERS" (
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pickup_location" TEXT NOT NULL,
    "delivery_location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "priority" TEXT NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ORDERS_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "AGENTS" (
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AGENTS_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "ASSIGNMENTS" (
    "assignment_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "assignment_status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ASSIGNMENTS_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "DELIVERY_STATUS" (
    "status_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DELIVERY_STATUS_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "EVENT_LOGS" (
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EVENT_LOGS_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "SYSTEM_METRICS" (
    "metric_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SYSTEM_METRICS_pkey" PRIMARY KEY ("metric_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USERS_email_key" ON "USERS"("email");

-- AddForeignKey
ALTER TABLE "ORDERS" ADD CONSTRAINT "ORDERS_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASSIGNMENTS" ADD CONSTRAINT "ASSIGNMENTS_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ORDERS"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASSIGNMENTS" ADD CONSTRAINT "ASSIGNMENTS_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "AGENTS"("agent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DELIVERY_STATUS" ADD CONSTRAINT "DELIVERY_STATUS_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ORDERS"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;
