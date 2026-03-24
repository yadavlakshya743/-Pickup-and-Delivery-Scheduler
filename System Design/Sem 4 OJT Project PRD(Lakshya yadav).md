# OJT Project

**Student Name:** Lakshya yadav  
**Roll No:** 240410700135  
**Year & Section:** 2nd Year  
**Project Title:** Pickup & Delivery Scheduler  
**Project Type:** Product Development  
**Stack / Framework:**Node.js , REST APIs, PostgreSQL

---

1. #  Problem Understanding

**1.1 What is the problem statement in your own words?**  
Managing pickup and delivery operations becomes difficult when the number of orders and delivery agents increases. Manual or poorly designed systems fail to assign tasks efficiently, cause delays, and break under high load. The problem is to reliably schedule, assign, and track pickup and delivery tasks in a scalable and fault-tolerant way.

**1.2 Why does this problem exist or matter?**

This problem exists because real-world logistics systems deal with high traffic, real-time updates, and frequent failures. Without a robust backend system, deliveries get delayed, agents are underutilized, and users lose trust.

Who benefits:

* Users: Get faster and more reliable deliveries  
* Delivery agents: Receive clear, timely task assignments  
* Businesses: Improve efficiency and reduce operational cost  
* Developers: Learn real-world distributed system design

**1.3 Key inputs and expected outputs:**

| Inputs | Process | Expected Outputs |
| ----- | ----- | ----- |
| Pickup & delivery request data Agent availability data Order priority and time windows  | Order validation and storage Scheduling and assignment logic Event-driven status updates Failure handling and retries  | Successfully scheduled delivery tasks Real-time delivery status updates Logs and metrics for system monitoring |

---

2. #  Functional Scope

**2.1 What are the core features you plan to build (must-haves)?**

* Pickup & delivery request creation  
* Automatic task scheduling and assignment  
* Delivery agent availability management  
* Real-time delivery status tracking  
* Failure handling and retry mechanism

**2.2 What stretch goals could you attempt if time permits?**

* Route optimization logic  
* Priority-based intelligent scheduling  
* Analytics dashboard for delivery performance  
* Auto-scaling configuration on cloud

**2.3 Which libraries or tools will you use?**

* Backend: Node.js with TypeScript  
* API: REST APIs, gRPC (internal)  
* Database: PostgreSQL  
* Cache: Redis  
* Messaging: Apache Kafka  
* Cloud: AWS (EC2, RDS, S3, CloudWatch)  
* DevOps: Docker, Kubernetes, GitHub Actions

---

3. # System & Design Thinking

**3.1 Sketch or describe your app flow / pipeline:**

**Pickup Request:**

**Order Service→ Scheduler Service → Agent Assignment → Event Queue (Kafka) → Status Updates→ Final Delivery→Confirmation** 

**3.2 What data structures or algorithms are central to this project?**

* Hash maps for fast lookup of agents and orders  
* Queues for scheduling and retries  
* Priority queues for urgent deliveries  
* Basic greedy scheduling algorithm

**3.3 How will you test correctness or performance?**

* Unit tests for API endpoints  
* Integration testing between services  
* Load testing for concurrent requests  
* Metrics such as latency, success rate, and failure rate

---

4. # Timeline & Milestones ( 8 Weeks)

| Week | Planned Deliverables | Mentor Checkpoint |
| ----- | ----- | ----- |
| **W1** | Problem understanding, requirement analysis, PRD finalization | ☐ |
| **W2** | System architecture design, flow diagrams, tech stack setup | ☐ |
| **W3** | Backend project setup, database schema design, basic APIs | ☐ |
| **W4** | Order Service implementation (CRUD), PostgreSQL & Redis integration | ☐ |
| **W5** | Scheduler Service logic, agent availability handling | ☐ |
| **W6** | Event-driven communication (Kafka), status updates, retries | ☐ |
| **W7** | Frontend web dashboard(basic UI and API integration) | ☐ |
| **W8** | Testing, performance checks,Documentation, demo preparation, final submission | ☐ |

---

5. # Risks & Dependencies

### **5.1 What’s the hardest part technically for you right now?**

* Designing a distributed scheduler  
* Handling failures and retries correctly  
* Setting up Kafka and Kubernetes

### **5.2 What dependencies or help do you need from mentors?**

* Review of system architecture  
* Feedback on scheduling logic  
* Guidance on cloud deployment best practices

---

6. # Evaluation Readiness

### **6.1 How will you prove that your project “works”?**

* API test results (Postman)  
* Screenshots of logs and dashboards  
* Demo video showing task scheduling  
* GitHub repository with clean commits

### **6.2 What success metric or goal will you aim for?**

* 100% working CRUD operations  
* Successful task assignment under load  
* Low scheduling latency (\< 200ms for basic cases)

---

7. # Responsibilities

### **7.1 Responsibilities**

| Task | Student Name | Mentor Notes |
| :---- | ----- | ----- |
| Task 1: Requirement Analysis | Lakshya | ☐ |
| Task 2: Backend Development | Lakshya | ☐ |
| Task 3: Scheduler Logic | Lakshya | ☐ |
| Task 4: Testing & Optimization | Lakshya | ☐ |
| Task 5: Documentation & Demo | Lakshya | ☐ |

**Signatures (Students):**  
**Mentor Approval:**  
**Date:**

