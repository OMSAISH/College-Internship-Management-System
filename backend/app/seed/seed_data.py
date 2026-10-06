import os
import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models import (
    User, UserRole, StudentProfile, PlacementStatus,
    FacultyProfile, Company, CompanyContact, CompanyRating,
    Internship, WorkMode, InternshipStatus,
    Application, ApplicationStatus, ApplicationStatusHistory, ApplicationDocument,
    Interview, InterviewStatus, InterviewResult,
    Evaluation, HiringRecommendation,
    Feedback, FeedbackTargetType, FeedbackStatus,
    Notification, NotificationCategory,
    AuditLog, SystemSetting, Bookmark
)

def run_seed():
    print("🌱 Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded with Sanjivani University data
        existing_admin = db.query(User).filter(User.email == "admin@demo.local").first()
        existing_setting = db.query(SystemSetting).filter(SystemSetting.key == "AFFILIATING_UNIVERSITY").first()
        if existing_admin and existing_setting and "Sanjivani" in str(existing_setting.value):
            print("✨ Sanjivani University seed data already exists in database. Skipping generation.")
            return
        elif existing_admin:
            print("🔄 Refreshing existing demo data with Sanjivani University collegiate dataset...")
            # Clear previous tables to reseed cleanly
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db.close()
            db = SessionLocal()

        print("🇮🇳 Seeding authentic Sanjivani University & Tech Industry Placement data...")

        # 1. System Settings - Aligned with Sanjivani University & AICTE Guidelines
        defaults = [
            ("ACADEMIC_SESSION", "2025-2026", "Current active academic session across colleges"),
            ("MIN_CGPA_THRESHOLD", "6.5", "Minimum CGPA (scale of 10.0) required for placement eligibility"),
            ("MAX_ACTIVE_APPLICATIONS_PER_STUDENT", "10", "Maximum concurrent active internship applications allowed per student"),
            ("INTERVIEW_NOTICE_MIN_HOURS", "24", "Mandatory minimum advance notice in hours before scheduling campus interviews"),
            ("ALLOW_STUDENT_COMPANY_RATINGS", "true", "Permit registered students to rate corporate recruitment culture"),
            ("AFFILIATING_UNIVERSITY", "Sanjivani University, Kopargaon (Autonomous / Private University, Maharashtra)", "Apex Institutional Entity"),
            ("PLACEMENT_CELL_CONTACT", "tpo@sanjivani.edu.in | +91 (02423) 222862", "Official Training & Placement Office contact"),
            ("CURRENCY_SYMBOL", "₹", "Official institutional currency symbol (INR)")
        ]
        for key, val, descr in defaults:
            db.add(SystemSetting(key=key, value=val, description=descr))

        # 2. Demo Core Accounts (Indian College Context)
        admin_user = User(
            email="admin@demo.local",
            password_hash=get_password_hash("Admin@1234"),
            first_name="Dr. Rajesh",
            last_name="Kulkarni",
            phone="+91 98220 12345",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)

        faculty_user = User(
            email="faculty@demo.local",
            password_hash=get_password_hash("Faculty@1234"),
            first_name="Prof. Sunita",
            last_name="Sharma",
            phone="+91 98220 54321",
            role=UserRole.FACULTY,
            is_active=True,
            is_verified=True
        )
        db.add(faculty_user)

        primary_student = User(
            email="student@demo.local",
            password_hash=get_password_hash("Student@1234"),
            first_name="Aarav",
            last_name="Sharma",
            phone="+91 98765 43210",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db.add(primary_student)
        db.commit()

        # Faculty profile for Prof. Sunita Sharma
        db.add(FacultyProfile(
            user_id=faculty_user.id,
            employee_id="SU-FAC-CSE-108",
            department="Computer Engineering",
            designation="Associate Professor & Training & Placement Coordinator",
            cabin_location="Sanjivani Tech Complex, Room 304, T&P Division"
        ))

        # Student profile for Aarav Sharma (Sanjivani University - B.Tech CSE)
        db.add(StudentProfile(
            user_id=primary_student.id,
            student_id_number="SU2022CS0001",
            department="Computer Engineering",
            batch_year=2026,
            gpa=9.24,  # Scale of 10.0
            bio="Final-year B.Tech Computer Engineering student at Sanjivani University, Kopargaon. Passionate about distributed systems, microservices, cloud-native architectures, and Go/FastAPI backend engineering. Smart India Hackathon (SIH) finalist and active open-source contributor.",
            resume_url="/api/v1/files/download/aarav_sharma_cse_resume.pdf",
            resume_filename="Aarav_Sharma_BTech_CSE_Resume.pdf",
            resume_updated_at=datetime.utcnow() - timedelta(days=3),
            linkedin_url="https://linkedin.com/in/aarav-sharma-tech",
            github_url="https://github.com/aarav-sharma",
            portfolio_url="https://aaravsharma.dev",
            skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "Go", "Redis", "Tailwind CSS", "Kubernetes"],
            education=[
                {"degree": "B.Tech in Computer Engineering", "institution": "Sanjivani University, Kopargaon", "start_year": 2022, "end_year": 2026, "gpa": 9.24},
                {"degree": "Higher Secondary Certificate (HSC) - Science", "institution": "Sanjivani Junior College, Kopargaon", "start_year": 2020, "end_year": 2022, "gpa": 9.40}
            ],
            projects=[
                {"title": "BharatPay UPI Gateway Simulator", "description": "High-throughput asynchronous mock payment settlement pipeline built with Go, Redis pub/sub, and PostgreSQL.", "tech_stack": ["Go", "Redis", "PostgreSQL", "Docker"], "github_url": "https://github.com/aarav-sharma/bharatpay-core"},
                {"title": "Campus Placement Drive Scheduler", "description": "Interactive interview slot scheduling and live applicant tracker with real-time status notifications.", "tech_stack": ["React", "FastAPI", "Tailwind CSS"], "github_url": "https://github.com/aarav-sharma/campus-tpo"}
            ],
            certifications=[
                {"name": "AWS Certified Solutions Architect - Associate", "issuer": "Amazon Web Services", "issue_date": "2025-05", "credential_url": "https://aws.amazon.com/verify/demo-123"},
                {"name": "NPTEL Elite Gold: Cloud Computing & Distributed Systems", "issuer": "IIT Kharagpur / NPTEL", "issue_date": "2024-11", "credential_url": "https://nptel.ac.in/noc"}
            ],
            placement_status=PlacementStatus.NOT_PLACED
        ))
        db.commit()

        # 3. 20 Authentic Indian Students Across Departments & Top Colleges
        realistic_students_data = [
            ("Priya", "Patel", "priya.patel@student.sanjivani.edu.in", "Computer Engineering", 9.45, ["Python", "PyTorch", "NLP", "FastAPI", "React"]),
            ("Rohan", "Deshmukh", "rohan.deshmukh@student.sanjivani.edu.in", "Information Technology", 8.85, ["Java", "Spring Boot", "MySQL", "Kubernetes", "Kafka"]),
            ("Sneha", "Kulkarni", "sneha.kulkarni@student.sanjivani.edu.in", "Artificial Intelligence & Data Science", 9.12, ["Python", "TensorFlow", "Pandas", "Computer Vision", "SQL"]),
            ("Aditya", "Nair", "aditya.nair@student.sanjivani.edu.in", "Electronics & Telecommunication", 8.55, ["C++", "Embedded C", "IoT", "RTOS", "Python"]),
            ("Ananya", "Iyer", "ananya.iyer@student.sanjivani.edu.in", "Computer Engineering", 9.30, ["TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS"]),
            ("Siddharth", "Verma", "siddharth.verma@student.sanjivani.edu.in", "Software Engineering", 8.75, ["Go", "Microservices", "Docker", "PostgreSQL", "gRPC"]),
            ("Kavya", "Swaminathan", "kavya.swaminathan@student.sanjivani.edu.in", "Data Science & Analytics", 9.20, ["Python", "R", "SQL", "Tableau", "Scikit-Learn"]),
            ("Vikram", "Joshi", "vikram.joshi@student.sanjivani.edu.in", "Computer Engineering", 8.40, ["C++", "Data Structures", "Algorithms", "Competitive Programming"]),
            ("Neha", "Gupta", "neha.gupta@student.sanjivani.edu.in", "Information Technology", 9.38, ["React", "Redux", "Node.js", "MongoDB", "AWS"]),
            ("Arjun", "Reddy", "arjun.reddy@student.sanjivani.edu.in", "Computer Engineering", 9.05, ["Python", "Deep Learning", "Transformers", "CUDA", "Linux"]),
            ("Pooja", "Sundaram", "pooja.sundaram@student.sanjivani.edu.in", "Artificial Intelligence & Robotics", 8.65, ["ROS2", "Python", "OpenCV", "C++", "SLAM"]),
            ("Rahul", "Mehta", "rahul.mehta@student.sanjivani.edu.in", "Computer Engineering", 8.80, ["Flutter", "Dart", "Firebase", "Android", "REST APIs"]),
            ("Tanvi", "Shinde", "tanvi.shinde@student.sanjivani.edu.in", "Cybersecurity & InfoSec", 9.15, ["Network Security", "Penetration Testing", "Wireshark", "Linux", "Python"]),
            ("Yash", "Patil", "yash.patil@student.sanjivani.edu.in", "Mechanical Engineering (IoT Minor)", 8.20, ["AutoCAD", "MATLAB", "SolidWorks", "Python", "PLC"]),
            ("Ishita", "Sen", "ishita.sen@student.sanjivani.edu.in", "Computer Engineering", 9.40, ["Rust", "Systems Programming", "Distributed Systems", "Linux Kernel"]),
            ("Nikhil", "Agrawal", "nikhil.agrawal@student.sanjivani.edu.in", "Computer Engineering", 8.60, ["C#", ".NET Core", "Azure", "SQL Server", "Docker"]),
            ("Riya", "Bansal", "riya.bansal@student.sanjivani.edu.in", "Information Technology", 9.22, ["Figma", "UI/UX", "React", "Design Systems", "HTML/CSS"]),
            ("Varun", "Menon", "varun.menon@student.sanjivani.edu.in", "Electronics & Communication", 8.48, ["VLSI", "Verilog", "Embedded Systems", "FPGA", "C"]),
            ("Divya", "Nambiar", "divya.nambiar@student.sanjivani.edu.in", "Data Science & Analytics", 8.92, ["Big Data", "Spark", "PySpark", "Snowflake", "PowerBI"]),
            ("Harsh", "Vardhan", "harsh.vardhan@student.sanjivani.edu.in", "Software Engineering", 8.70, ["JavaScript", "Express", "MongoDB", "Docker", "Node.js"])
        ]

        all_student_users = [primary_student]
        for idx, (first, last, email, dept, gpa, skills) in enumerate(realistic_students_data, start=2):
            s_user = User(
                email=email,
                password_hash=get_password_hash("Student@1234"),
                first_name=first,
                last_name=last,
                phone=f"+91 98220 {idx:02d}941",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True
            )
            db.add(s_user)
            db.commit()
            all_student_users.append(s_user)

            db.add(StudentProfile(
                user_id=s_user.id,
                student_id_number=f"SU2022CS{1000 + idx:04d}",
                department=dept,
                batch_year=2026,
                gpa=gpa,
                bio=f"Pre-final year {dept} student at Sanjivani University, Kopargaon. Dedicated to engineering robust, industry-ready solutions.",
                resume_url=f"/api/v1/files/download/{first.lower()}_{last.lower()}_resume.pdf",
                resume_filename=f"{first}_{last}_BTech_Resume.pdf",
                resume_updated_at=datetime.utcnow() - timedelta(days=random.randint(1, 15)),
                skills=skills,
                placement_status=PlacementStatus.PLACED if idx % 5 == 0 else PlacementStatus.NOT_PLACED
            ))
        db.commit()

        # 4. 10 Top Indian Tech Companies & Global Capability Centers (GCCs)
        companies_data = [
            (
                "Razorpay Software Private Limited",
                "U72200KA2013PTC071367",
                "FinTech & Payment Infrastructure",
                "https://razorpay.com",
                "Bengaluru, Karnataka (Koramangala)",
                "Razorpay is India's leading full-stack financial services and payment gateway unicorn, processing billions in transactions annually for businesses across India."
            ),
            (
                "Tata Consultancy Services (TCS)",
                "L22210MH1995PLC084781",
                "Enterprise IT & Cloud Solutions",
                "https://www.tcs.com",
                "Mumbai, Maharashtra (Offices: Pune Hinjawadi, Bengaluru)",
                "A flagship Tata enterprise and India's most valuable tech powerhouse, TCS pioneers digital transformation, AI, and cognitive business operations globally."
            ),
            (
                "Infosys Limited",
                "L85110KA1981PLC013115",
                "Digital Services, AI & Cloud Platforms",
                "https://www.infosys.com",
                "Bengaluru, Karnataka (Electronics City)",
                "A global leader in next-generation digital services, enterprise cloud consulting (Infosys Cobalt), and human-centric artificial intelligence (Infosys Topaz)."
            ),
            (
                "Zomato Limited (Eternal)",
                "L93030DL2010PLC198141",
                "FoodTech, Quick-Commerce & Logistics",
                "https://www.zomato.com",
                "Gurugram, Haryana (Delhi NCR)",
                "Pioneering hyper-local delivery, AI dispatch routing algorithms, and consumer logistics serving millions of customers daily across hundreds of Indian cities."
            ),
            (
                "Reliance Jio Infocomm Limited",
                "U72900GJ2007PLC105869",
                "Telecom, 5G Cloud & AI Platforms",
                "https://www.jio.com",
                "Navi Mumbai, Maharashtra (Reliance Corporate Park)",
                "India's largest digital services provider, engineering sovereign 5G standalone architecture, cloud-native telecom stacks, and connected IoT smart grid solutions."
            ),
            (
                "Flipkart Internet Private Limited",
                "U51109KA2012PTC066107",
                "E-Commerce & Supply Chain Automation",
                "https://www.flipkart.com",
                "Bengaluru, Karnataka (Bellandur)",
                "India's homegrown e-commerce pioneer, building high-throughput distributed transaction engines, intelligent search ranking, and robotic supply chains."
            ),
            (
                "PhonePe Private Limited",
                "U72900KA2012PTC081944",
                "FinTech, UPI & Digital Insurance",
                "https://www.phonepe.com",
                "Bengaluru, Karnataka (Green Glen Layout)",
                "India's leading UPI payments platform handling over 50% of the country's digital retail payments with ultra-low latency distributed payment switches."
            ),
            (
                "Wipro Limited",
                "L32102KA1945PLC020800",
                "IT Consulting, Cybersecurity & Cloud Infrastructure",
                "https://www.wipro.com",
                "Bengaluru, Karnataka (Sarjapur Road)",
                "A leading multinational technology services and consulting company delivering end-to-end cloud, cybersecurity, and applied AI transformation."
            ),
            (
                "HCL Technologies Limited",
                "L74140DL1991PLC046369",
                "Engineering R&D, Cybersecurity & Hybrid Cloud",
                "https://www.hcltech.com",
                "Noida, Uttar Pradesh (Tech Hub, Sector 126)",
                "Global engineering R&D titan delivering chip-to-cloud software, aerospace telemetry, and enterprise cybersecurity across 60 countries."
            ),
            (
                "Swiggy Limited",
                "U74110KA2013PLC096530",
                "On-Demand Delivery, Quick Commerce & AI Dispatch",
                "https://www.swiggy.com",
                "Bengaluru, Karnataka (Marathahalli)",
                "India's pioneering on-demand convenience platform connecting consumers with thousands of restaurants and instant Instamart delivery pods."
            )
        ]

        created_companies = []
        for name, reg_num, industry, web, loc, about in companies_data:
            comp = Company(
                name=name,
                registration_number=reg_num,
                industry=industry,
                website=web,
                location=loc,
                about=about,
                is_verified=True,
                created_by_user_id=admin_user.id
            )
            db.add(comp)
            db.commit()
            created_companies.append(comp)

            # Add official university relations contact
            db.add(CompanyContact(
                company_id=comp.id,
                contact_name="Head of University Relations & Campus Hiring",
                email=f"campus-recruitment@{name.lower().split()[0].replace(',', '')}.in",
                phone="+91 (080) 4123-8899",
                designation="Director - Campus Talent Acquisition (India)",
                is_primary=True
            ))

            # Add authentic student ratings
            reviews_pool = [
                "Outstanding engineering culture with massive scale. Mentors treat interns as full-time software engineers and provide direct ownership of critical PRs.",
                "Fast-paced environment solving genuine Indian consumer challenges at scale. Weekly syncs with principal architects helped accelerate my career.",
                "Excellent stipend, state-of-the-art office facilities, and high Pre-Placement Offer (PPO) conversion rates for performing college students.",
                "Incredible learning curve! Built production-ready microservices handling thousands of requests per second during my 16-week tenure."
            ]
            for rev_text in reviews_pool[:3]:
                student_rater = random.choice(all_student_users)
                db.add(CompanyRating(
                    company_id=comp.id,
                    student_id=student_rater.id,
                    culture_rating=random.randint(4, 5),
                    mentorship_rating=random.randint(4, 5),
                    learning_rating=random.randint(4, 5),
                    work_env_rating=random.randint(4, 5),
                    overall_rating=random.randint(4, 5),
                    review=rev_text
                ))
        db.commit()

        # 5. 20 Real-World Indian Tech Internships with INR Stipends (₹)
        # Note: Stipends reflect top tier Indian engineering campus internships (₹25,000 - ₹65,000/month)
        internships_spec = [
            (
                "Razorpay Software Private Limited",
                "Backend Engineering Intern (FinTech Infrastructure)",
                "Software Engineering",
                WorkMode.HYBRID,
                50000.0,
                16,
                4,
                ["Go", "PostgreSQL", "Redis", "Kafka", "Docker"],
                "Bengaluru, Karnataka"
            ),
            (
                "Razorpay Software Private Limited",
                "Full-Stack Web Engineering Intern",
                "Software Engineering",
                WorkMode.HYBRID,
                45000.0,
                12,
                3,
                ["React", "TypeScript", "Node.js", "Tailwind CSS"],
                "Bengaluru, Karnataka"
            ),
            (
                "Tata Consultancy Services (TCS)",
                "Cloud DevOps & Platform Automation Intern",
                "DevOps & Cloud",
                WorkMode.HYBRID,
                30000.0,
                12,
                8,
                ["Linux", "Docker", "Kubernetes", "AWS", "Terraform"],
                "Pune, Maharashtra (Hinjawadi)"
            ),
            (
                "Tata Consultancy Services (TCS)",
                "Cybersecurity & SOC Operations Intern",
                "Cybersecurity",
                WorkMode.ON_SITE,
                28000.0,
                14,
                5,
                ["Network Security", "Wireshark", "Linux", "SIEM", "Python"],
                "Chennai, Tamil Nadu"
            ),
            (
                "Infosys Limited",
                "Enterprise Cloud Architecture Intern (Cobalt)",
                "Software Engineering",
                WorkMode.HYBRID,
                32000.0,
                16,
                6,
                ["Java", "Spring Boot", "Microservices", "MySQL"],
                "Bengaluru, Karnataka (Electronics City)"
            ),
            (
                "Infosys Limited",
                "Generative AI & LLM Solutions Intern (Topaz)",
                "Artificial Intelligence",
                WorkMode.ON_SITE,
                38000.0,
                12,
                4,
                ["Python", "PyTorch", "Transformers", "LangChain", "FastAPI"],
                "Hyderabad, Telangana"
            ),
            (
                "Zomato Limited (Eternal)",
                "Frontend React & Mobile Web Intern",
                "UI/UX & Frontend",
                WorkMode.HYBRID,
                45000.0,
                12,
                3,
                ["React", "TypeScript", "Next.js", "Web Performance"],
                "Gurugram, Haryana"
            ),
            (
                "Zomato Limited (Eternal)",
                "Data Science & Supply-Demand Analytics Intern",
                "Data Science",
                WorkMode.ON_SITE,
                50000.0,
                16,
                2,
                ["Python", "SQL", "Pandas", "Scikit-Learn", "Tableau"],
                "Gurugram, Haryana"
            ),
            (
                "Flipkart Internet Private Limited",
                "SDE Intern (High-Scale Catalog & Search Systems)",
                "Software Engineering",
                WorkMode.HYBRID,
                60000.0,
                16,
                4,
                ["Java", "Distributed Systems", "Elasticsearch", "Kafka"],
                "Bengaluru, Karnataka"
            ),
            (
                "Flipkart Internet Private Limited",
                "Supply Chain Automation & Robotics Intern",
                "Robotics & Automation",
                WorkMode.ON_SITE,
                45000.0,
                12,
                3,
                ["Python", "C++", "ROS", "Computer Vision"],
                "Hyderabad, Telangana"
            ),
            (
                "PhonePe Private Limited",
                "Low-Latency Distributed Systems Intern",
                "Software Engineering",
                WorkMode.HYBRID,
                55000.0,
                16,
                3,
                ["Java", "Go", "Distributed Systems", "Cassandra", "gRPC"],
                "Bengaluru, Karnataka"
            ),
            (
                "PhonePe Private Limited",
                "FinTech Fraud Detection & Security Analyst Intern",
                "Cybersecurity",
                WorkMode.REMOTE,
                40000.0,
                12,
                2,
                ["Python", "SQL", "Cyber Threat Intelligence", "Machine Learning"],
                "Bengaluru, Karnataka"
            ),
            (
                "Reliance Jio Infocomm Limited",
                "5G Core & Cloud-Native Network Software Intern",
                "Telecommunications & Cloud",
                WorkMode.ON_SITE,
                35000.0,
                16,
                5,
                ["Linux Kernel", "C++", "Docker", "Kubernetes", "Open5GS"],
                "Navi Mumbai, Maharashtra"
            ),
            (
                "Reliance Jio Infocomm Limited",
                "IoT Smart Edge & Embedded Devices Intern",
                "Embedded Systems",
                WorkMode.HYBRID,
                30000.0,
                12,
                4,
                ["C", "Embedded C", "Microcontrollers", "MQTT", "Python"],
                "Pune, Maharashtra"
            ),
            (
                "Wipro Limited",
                "Enterprise Java Microservices Engineering Intern",
                "Software Engineering",
                WorkMode.HYBRID,
                26000.0,
                12,
                6,
                ["Java", "Spring Boot", "PostgreSQL", "REST APIs"],
                "Bengaluru, Karnataka"
            ),
            (
                "Wipro Limited",
                "Site Reliability Engineering (SRE) & Observability Intern",
                "DevOps & Cloud",
                WorkMode.REMOTE,
                28000.0,
                14,
                3,
                ["Linux", "Python", "Prometheus", "Grafana", "Ansible"],
                "Hyderabad, Telangana"
            ),
            (
                "HCL Technologies Limited",
                "Computer Vision & Edge AI Research Intern",
                "Artificial Intelligence",
                WorkMode.HYBRID,
                35000.0,
                16,
                3,
                ["Python", "OpenCV", "TensorFlow", "Edge Computing"],
                "Noida, Uttar Pradesh"
            ),
            (
                "HCL Technologies Limited",
                "Embedded Automotive Systems Firmware Intern",
                "Embedded Systems",
                WorkMode.ON_SITE,
                32000.0,
                12,
                4,
                ["Embedded C", "CAN Bus", "RTOS", "Automotive SPICE"],
                "Chennai, Tamil Nadu"
            ),
            (
                "Swiggy Limited",
                "Machine Learning & Dispatch Optimization Intern",
                "Data Science & AI",
                WorkMode.HYBRID,
                50000.0,
                16,
                2,
                ["Python", "PyTorch", "Operations Research", "SQL", "Pandas"],
                "Bengaluru, Karnataka"
            ),
            (
                "Swiggy Limited",
                "Design Systems & Product UI/UX Intern",
                "UI/UX & Design",
                WorkMode.REMOTE,
                35000.0,
                12,
                2,
                ["Figma", "Design Systems", "Prototyping", "User Research"],
                "Bengaluru, Karnataka"
            )
        ]

        created_internships = []
        comp_map = {c.name: c for c in created_companies}

        for comp_name, title, domain, mode, stipend, duration, openings, skills, loc in internships_spec:
            company_obj = comp_map[comp_name]
            start_d = date.today() + timedelta(days=40)
            end_d = start_d + timedelta(weeks=duration)
            deadline = date.today() + timedelta(days=20)

            internship = Internship(
                company_id=company_obj.id,
                posted_by_user_id=faculty_user.id,
                title=title,
                domain=domain,
                description=f"Join {comp_name} for an intensive {duration}-week campus internship. You will collaborate directly with seasoned engineering architects in {loc} to engineer resilient, high-volume systems powering India's tech ecosystem.",
                responsibilities="• Design, implement, and benchmark production-grade microservices aligned with strict engineering guidelines.\n• Write high-coverage automated unit, integration, and load tests.\n• Participate actively in agile sprint planning, technical RFCs, and daily scrums.\n• Present final end-of-term capstone deliverables to departmental leadership and corporate mentors.",
                requirements=f"• Currently pursuing B.Tech / M.Tech in Computer Engineering, Information Technology, AI & Data Science, or allied disciplines.\n• Proven mastery in {', '.join(skills[:2])}.\n• Minimum CGPA of 7.0/10.0 with no active academic backlogs.\n• Solid understanding of Data Structures, Algorithms, and Software Engineering principles.",
                eligibility_criteria="Available for full-time on-site/hybrid internship during the upcoming semester. College NOC (No Objection Certificate) required upon selection.",
                benefits=f"• Attractive monthly stipend of ₹{stipend:,.0f} INR.\n• Dedicated 1-on-1 industry mentorship from a senior tech lead.\n• Pre-Placement Offer (PPO) evaluation opportunity upon exemplary performance.\n• Corporate laptop, wellness allowances, and verified institutional certification.",
                location=loc,
                work_mode=mode,
                stipend_amount=stipend,
                stipend_currency="INR",
                duration_weeks=duration,
                openings=openings,
                start_date=start_d,
                end_date=end_d,
                application_deadline=deadline,
                skills_required=skills,
                status=InternshipStatus.APPROVED,
                is_featured=(stipend >= 45000.0)
            )
            db.add(internship)
            db.commit()
            created_internships.append(internship)

        # 6. Realistic Applications, Status Timelines, Campus Interviews & AICTE 7-Criteria Evaluations
        print("📝 Generating realistic applications, interviews, and ABET/AICTE evaluations...")

        # Application 1: Aarav Sharma -> Razorpay Backend Engineering Intern (ACCEPTED with PPO Track)
        app1 = Application(
            internship_id=created_internships[0].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aarav_sharma_cse_resume.pdf",
            cover_letter="Respected Hiring Committee at Razorpay, I am writing to express my enthusiastic application for the Backend Engineering Internship position. Having developed high-throughput transaction pipelines in Go and published research on distributed locking mechanisms, I am passionate about contributing to Razorpay's mission-critical payment switches.",
            qualifications={
                "cgpa": "9.24 / 10.0",
                "degree": "B.Tech in Computer Engineering",
                "university": "Sanjivani University, Kopargaon",
                "relevant_coursework": "Distributed Systems, Database Engineering, Algorithms, Operating Systems"
            },
            status=ApplicationStatus.ACCEPTED,
            faculty_notes="Ranked in top 2% of the batch. Exceptional coding round score (100/100) and exemplary systems knowledge during the technical screening.",
            faculty_rating=5
        )
        db.add(app1)
        db.commit()

        # Application 1 Timeline
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.PENDING, comment="Application successfully submitted via College TPO Portal", changed_by_user_id=primary_student.id, created_at=datetime.utcnow() - timedelta(days=14)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.SHORTLISTED, comment="Resume shortlisted based on CGPA and SIH finalist portfolio", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=10)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.INTERVIEW_SCHEDULED, comment="Technical round scheduled with Razorpay Core Payments team", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=6)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.ACCEPTED, comment="Formal Internship Offer Letter released (₹50,000/month stipend)", changed_by_user_id=admin_user.id, created_at=datetime.utcnow() - timedelta(days=1)))
        db.commit()

        # Interview for App 1 (Completed, Passed)
        iv1 = Interview(
            application_id=app1.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Vikramaditya Sengupta (Staff Engineer - Razorpay)",
            interviewer_email="vikramaditya.s@razorpay.in",
            round_name="Technical Architecture & Distributed Systems Coding",
            scheduled_at=datetime.utcnow() - timedelta(days=3),
            duration_minutes=60,
            location_or_link="Google Meet: https://meet.google.com/rzp-campus-eng",
            status=InterviewStatus.COMPLETED,
            feedback="Aarav demonstrated stellar command of concurrency primitives in Go, distributed transaction boundaries (2PC vs Saga), and database index optimization in PostgreSQL.",
            result=InterviewResult.PASSED
        )
        db.add(iv1)
        db.commit()

        # Evaluation for App 1 (AICTE / ABET Outcome-Based Rubrics)
        db.add(Evaluation(
            application_id=app1.id,
            internship_id=app1.internship_id,
            student_id=app1.student_id,
            evaluator_user_id=faculty_user.id,
            technical_score=5,
            communication_score=5,
            problem_solving_score=5,
            teamwork_score=5,
            punctuality_score=5,
            responsibility_score=5,
            learning_ability_score=5,
            overall_score=5.0,
            strengths="Flawless mastery over high-throughput systems, clear architectural diagrams, and structured articulation of trade-offs.",
            areas_for_improvement="Explore zero-knowledge proofs and emerging cryptography primitives in modern fintech.",
            comments="Outstanding candidate. Unanimous recommendation for Pre-Placement Offer (PPO) post-internship.",
            hiring_recommendation=HiringRecommendation.STRONGLY_RECOMMEND
        ))

        # Application 2: Aarav Sharma -> Flipkart SDE Intern (SHORTLISTED)
        app2 = Application(
            internship_id=created_internships[8].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aarav_sharma_cse_resume.pdf",
            cover_letter="Flipkart's engineering challenges at Big Billion Days scale represent the peak of Indian systems engineering. I am keen to tackle high-throughput catalog indexing and real-time event streaming.",
            qualifications={"cgpa": "9.24 / 10.0", "degree": "B.Tech Computer Engineering"},
            status=ApplicationStatus.SHORTLISTED,
            faculty_notes="Resume approved by Department Placement Committee; forwarded to Flipkart Campus Recruiting.",
            faculty_rating=5
        )
        db.add(app2)
        db.commit()

        db.add(ApplicationStatusHistory(application_id=app2.id, status=ApplicationStatus.PENDING, comment="Online application submitted", changed_by_user_id=primary_student.id, created_at=datetime.utcnow() - timedelta(days=7)))
        db.add(ApplicationStatusHistory(application_id=app2.id, status=ApplicationStatus.SHORTLISTED, comment="Shortlisted for Technical Assessment Round 1", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=2)))
        db.commit()

        # Upcoming Interview for App 2
        db.add(Interview(
            application_id=app2.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Deepak Narang (Principal Architect - Flipkart)",
            interviewer_email="deepak.n@flipkart.com",
            round_name="Data Structures & High-Scale Systems Design",
            scheduled_at=datetime.utcnow() + timedelta(days=2, hours=3),
            duration_minutes=60,
            location_or_link="Microsoft Teams: https://teams.microsoft.com/l/meetup-join/flipkart-campus",
            status=InterviewStatus.SCHEDULED,
            result=InterviewResult.PENDING
        ))

        # Application 3: Aarav Sharma -> PhonePe Low-Latency Systems (INTERVIEW_SCHEDULED)
        app3 = Application(
            internship_id=created_internships[10].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aarav_sharma_cse_resume.pdf",
            cover_letter="PhonePe's UPI infrastructure handles massive scale with sub-millisecond latencies. My deep background in network sockets and caching aligns directly with your platform team.",
            qualifications={"cgpa": "9.24 / 10.0", "skills": ["Go", "Java", "Redis", "gRPC"]},
            status=ApplicationStatus.INTERVIEW_SCHEDULED,
            faculty_notes="Strong algorithmic candidate with top percentile in national coding leagues.",
            faculty_rating=5
        )
        db.add(app3)
        db.commit()

        db.add(Interview(
            application_id=app3.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Rohit Agrawal (Director of Engineering - PhonePe)",
            interviewer_email="rohit.a@phonepe.com",
            round_name="Low-Level Design & Concurrency Coding",
            scheduled_at=datetime.utcnow() + timedelta(days=4, hours=5),
            duration_minutes=45,
            location_or_link="Google Meet: https://meet.google.com/php-campus-drive",
            status=InterviewStatus.SCHEDULED,
            result=InterviewResult.PENDING
        ))

        # Additional 25 applications across other students
        statuses = [
            ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED,
            ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.ACCEPTED,
            ApplicationStatus.REJECTED
        ]
        
        for idx, student in enumerate(all_student_users[1:16], start=1):
            target_internship = created_internships[idx % len(created_internships)]
            selected_status = statuses[idx % len(statuses)]
            
            app = Application(
                internship_id=target_internship.id,
                student_id=student.id,
                resume_url=f"/api/v1/files/download/{student.first_name.lower()}_{student.last_name.lower()}_resume.pdf",
                cover_letter=f"Respected Placement Committee, I wish to apply for the {target_internship.title} position at {target_internship.company.name}. My academic coursework at Sanjivani University and hands-on projects directly align with your requirements.",
                qualifications={"cgpa": f"{student.student_profile.gpa} / 10.0", "department": student.student_profile.department},
                status=selected_status,
                faculty_notes="Candidate reviewed and recommended by Department T&P Advisor.",
                faculty_rating=random.randint(3, 5)
            )
            db.add(app)
            db.commit()

            # Status history
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                status=ApplicationStatus.PENDING,
                comment="Campus drive application recorded",
                changed_by_user_id=student.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 20))
            ))

            if selected_status != ApplicationStatus.PENDING:
                db.add(ApplicationStatusHistory(
                    application_id=app.id,
                    status=selected_status,
                    comment=f"Application stage updated to {selected_status.value}",
                    changed_by_user_id=faculty_user.id,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 8))
                ))

            # Interviews
            if selected_status in [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.ACCEPTED]:
                db.add(Interview(
                    application_id=app.id,
                    scheduled_by_user_id=faculty_user.id,
                    interviewer_name=f"Campus Tech Panel @ {target_internship.company.name}",
                    interviewer_email=f"campus@{target_internship.company.name.lower().split()[0].replace(',', '')}.in",
                    round_name="Technical & Problem Solving Round",
                    scheduled_at=datetime.utcnow() + timedelta(days=random.randint(2, 7), hours=random.randint(9, 16)),
                    duration_minutes=45,
                    location_or_link=f"Google Meet / Seminar Hall {random.randint(1, 4)}",
                    status=InterviewStatus.SCHEDULED if selected_status == ApplicationStatus.INTERVIEW_SCHEDULED else InterviewStatus.COMPLETED,
                    result=InterviewResult.PENDING if selected_status == ApplicationStatus.INTERVIEW_SCHEDULED else InterviewResult.PASSED
                ))

            # Evaluations
            if selected_status == ApplicationStatus.ACCEPTED:
                db.add(Evaluation(
                    application_id=app.id,
                    internship_id=app.internship_id,
                    student_id=app.student_id,
                    evaluator_user_id=faculty_user.id,
                    technical_score=random.randint(4, 5),
                    communication_score=random.randint(4, 5),
                    problem_solving_score=random.randint(4, 5),
                    teamwork_score=random.randint(4, 5),
                    punctuality_score=5,
                    responsibility_score=random.randint(4, 5),
                    learning_ability_score=5,
                    overall_score=round(random.uniform(4.3, 4.9), 2),
                    strengths="Strong analytical thinking, adherence to clean coding principles, and effective collaboration.",
                    comments="Recommended for placement.",
                    hiring_recommendation=HiringRecommendation.RECOMMEND
                ))

        db.commit()

        # 7. Notifications for Primary Student (Aarav Sharma)
        db.add(Notification(
            user_id=primary_student.id,
            title="Internship Offer Extended! 🎉",
            message="Congratulations Aarav! Razorpay has officially released your offer for Backend Engineering Intern (Stipend: ₹50,000/month).",
            category=NotificationCategory.APPLICATION,
            link="/student/applications",
            is_read=False
        ))
        db.add(Notification(
            user_id=primary_student.id,
            title="Campus Interview Call: Flipkart 🚀",
            message="Your Technical Systems round with Principal Architect Deepak Narang is scheduled in 2 days at 11:30 AM IST.",
            category=NotificationCategory.INTERVIEW,
            link="/student/interviews",
            is_read=False
        ))
        db.add(Notification(
            user_id=primary_student.id,
            title="AICTE Faculty Evaluation Report Available",
            message="T&P Coordinator Prof. Sunita Sharma has submitted your semester performance review (Overall Score: 5.0/5.0).",
            category=NotificationCategory.EVALUATION,
            link="/student/applications",
            is_read=True
        ))

        # 8. Feedback records
        db.add(Feedback(
            from_user_id=primary_student.id,
            target_type=FeedbackTargetType.COMPANY,
            target_id=created_companies[0].id,
            rating=5,
            title="Exceptional Campus Drive Process at Razorpay",
            comment="The technical problem statements reflected genuine production challenges. Mentors and panelists were very supportive and provided actionable feedback.",
            status=FeedbackStatus.RESOLVED,
            admin_response="Thank you for your feedback Aarav. The Training & Placement Office appreciates Razorpay's continued partnership with Sanjivani University."
        ))
        db.add(Feedback(
            from_user_id=primary_student.id,
            target_type=FeedbackTargetType.SYSTEM,
            rating=5,
            title="Seamless TPO Application & Interview Tracking",
            comment="The multi-step application wizard, real-time status updates, and interview calendar have made our placement season completely paperless and transparent!",
            status=FeedbackStatus.SUBMITTED
        ))

        # 9. Audit Logs
        db.add(AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            details="College Internship Management System database initialized with Indian collegiate & enterprise placement dataset."
        ))
        db.add(AuditLog(
            user_id=faculty_user.id,
            user_email=faculty_user.email,
            action="CREATE_INTERNSHIP",
            entity_type="INTERNSHIP",
            details="Created 20 verified corporate internship postings with INR stipends across Bengaluru, Pune, Hyderabad, and Mumbai."
        ))
        db.add(AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="APPROVE_INTERNSHIP",
            entity_type="INTERNSHIP",
            details="Approved all verified Indian partner company drives (TCS, Infosys, Razorpay, Zomato, Flipkart, PhonePe, Jio, Swiggy, HCLTech, Wipro)."
        ))

        # 10. Bookmarks for primary student
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[0].id))
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[8].id))
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[10].id))

        db.commit()
        print("✅ Indian University & Placement Database seeding successfully completed!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
