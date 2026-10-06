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
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@demo.local").first():
            print("✨ Seed data already exists in database. Skipping generation.")
            return

        print("🚀 Seeding realistic demo accounts & institutional data...")

        # 1. System Settings
        defaults = [
            ("ACADEMIC_YEAR", "2025-2026", "Current active academic session"),
            ("MIN_GPA_THRESHOLD", "2.0", "Minimum GPA to apply for internships"),
            ("MAX_ACTIVE_APPLICATIONS_PER_STUDENT", "10", "Maximum concurrent active applications"),
            ("INTERVIEW_NOTICE_MIN_HOURS", "24", "Minimum hours required before interview schedule"),
            ("ALLOW_STUDENT_COMPANY_RATINGS", "true", "Enable students to submit company reviews")
        ]
        for key, val, descr in defaults:
            db.add(SystemSetting(key=key, value=val, description=descr))

        # 2. Demo Core Accounts
        admin_user = User(
            email="admin@demo.local",
            password_hash=get_password_hash("Admin@1234"),
            first_name="Dr. Eleanor",
            last_name="Vance",
            phone="+1 (555) 019-2831",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)

        faculty_user = User(
            email="faculty@demo.local",
            password_hash=get_password_hash("Faculty@1234"),
            first_name="Prof. Marcus",
            last_name="Sterling",
            phone="+1 (555) 019-4820",
            role=UserRole.FACULTY,
            is_active=True,
            is_verified=True
        )
        db.add(faculty_user)

        primary_student = User(
            email="student@demo.local",
            password_hash=get_password_hash("Student@1234"),
            first_name="Aiden",
            last_name="Reynolds",
            phone="+1 (555) 018-7732",
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=True
        )
        db.add(primary_student)
        db.commit()

        # Faculty profile for Prof. Marcus Sterling
        db.add(FacultyProfile(
            user_id=faculty_user.id,
            employee_id="FAC-CS-101",
            department="Computer Science & Engineering",
            designation="Director of Corporate Relations & Internship Coordinator",
            cabin_location="Technology Block A, Room 304"
        ))

        # Student profile for Aiden Reynolds
        db.add(StudentProfile(
            user_id=primary_student.id,
            student_id_number="STU2026-0001",
            department="Computer Science",
            batch_year=2026,
            gpa=3.88,
            bio="Senior Computer Science undergraduate specializing in full-stack architecture, distributed systems, and cloud infrastructure. Open-source contributor and hackathon finalist.",
            resume_url="/api/v1/files/download/aiden_reynolds_resume.pdf",
            resume_filename="Aiden_Reynolds_CS_Resume.pdf",
            resume_updated_at=datetime.utcnow() - timedelta(days=5),
            linkedin_url="https://linkedin.com/in/aiden-reynolds",
            github_url="https://github.com/aiden-reynolds",
            portfolio_url="https://aidenreynolds.dev",
            skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "AWS", "Tailwind CSS"],
            education=[
                {"degree": "Bachelor of Science in Computer Science", "institution": "State University of Technology", "start_year": 2022, "end_year": 2026, "gpa": 3.88}
            ],
            projects=[
                {"title": "Distributed Task Scheduler", "description": "High-throughput asynchronous task queue built with Go and Redis.", "tech_stack": ["Go", "Redis", "Docker"], "github_url": "https://github.com/demo/task-scheduler"},
                {"title": "Cloud Monitoring Dashboard", "description": "Real-time metrics aggregator visualizer using React and WebSockets.", "tech_stack": ["React", "FastAPI", "ChartJS"], "github_url": "https://github.com/demo/cloud-monitor"}
            ],
            certifications=[
                {"name": "AWS Certified Solutions Architect - Associate", "issuer": "Amazon Web Services", "issue_date": "2025-04", "credential_url": "https://aws.amazon.com/verify/123"}
            ],
            placement_status=PlacementStatus.NOT_PLACED
        ))
        db.commit()

        # 3. 20 Realistic Students
        realistic_students_data = [
            ("Sophia", "Chen", "sophia.chen@student.university.edu", "Computer Science", 3.95, ["Python", "PyTorch", "NLP", "React"]),
            ("Liam", "Kowalski", "liam.k@student.university.edu", "Information Technology", 3.72, ["Java", "Spring Boot", "MySQL", "Kubernetes"]),
            ("Priya", "Nambiar", "priya.n@student.university.edu", "Data Science", 3.91, ["R", "Python", "SQL", "Tableau", "Machine Learning"]),
            ("Lucas", "Silva", "lucas.silva@student.university.edu", "Software Engineering", 3.65, ["TypeScript", "Next.js", "Node.js", "GraphQL"]),
            ("Emma", "Watson", "emma.w@student.university.edu", "Cybersecurity", 3.82, ["Network Security", "Cryptography", "Linux", "Python", "Wireshark"]),
            ("Devon", "Brooks", "devon.b@student.university.edu", "Computer Science", 3.54, ["C++", "Algorithms", "OpenCV", "Git"]),
            ("Zoe", "Katsaros", "zoe.k@student.university.edu", "Artificial Intelligence", 3.98, ["Deep Learning", "TensorFlow", "Computer Vision", "Python"]),
            ("Ethan", "Hunt", "ethan.h@student.university.edu", "Computer Science", 3.45, ["Go", "Microservices", "Docker", "PostgreSQL"]),
            ("Ananya", "Sharma", "ananya.s@student.university.edu", "Information Technology", 3.89, ["React", "Redux", "Tailwind CSS", "REST APIs"]),
            ("Mateo", "Rodriguez", "mateo.r@student.university.edu", "Computer Science", 3.68, ["Python", "Django", "PostgreSQL", "Celery"]),
            ("Chloe", "Dubois", "chloe.d@student.university.edu", "Data Science", 3.76, ["Pandas", "Scikit-Learn", "Big Data", "PowerBI"]),
            ("Noah", "Kim", "noah.k@student.university.edu", "Software Engineering", 3.84, ["Flutter", "Dart", "Firebase", "Mobile Architecture"]),
            ("Aaliyah", "Khan", "aaliyah.k@student.university.edu", "Cybersecurity", 3.93, ["Penetration Testing", "Security Auditing", "Python", "Bash"]),
            ("Benjamin", "Foster", "ben.f@student.university.edu", "Computer Science", 3.61, ["C#", ".NET Core", "Azure", "SQL Server"]),
            ("Mia", "Takahashi", "mia.t@student.university.edu", "UI/UX & Design Computing", 3.87, ["Figma", "Design Systems", "HTML/CSS", "User Research"]),
            ("Oliver", "Hansen", "oliver.h@student.university.edu", "Cloud Computing", 3.79, ["Terraform", "AWS", "CI/CD", "Linux Admin"]),
            ("Isabella", "Rossi", "isabella.r@student.university.edu", "Information Systems", 3.70, ["Business Analytics", "SQL", "Scrum", "Jira"]),
            ("Julian", "Morales", "julian.m@student.university.edu", "Computer Science", 3.85, ["Rust", "Systems Programming", "Distributed Systems"]),
            ("Kavya", "Patel", "kavya.p@student.university.edu", "Data Science", 3.92, ["Statistics", "Python", "Data Modeling", "Spark"]),
            ("Gabriel", "Santos", "gabriel.s@student.university.edu", "Software Engineering", 3.58, ["JavaScript", "Express", "MongoDB", "React"])
        ]

        all_student_users = [primary_student]
        for idx, (first, last, email, dept, gpa, skills) in enumerate(realistic_students_data, start=2):
            s_user = User(
                email=email,
                password_hash=get_password_hash("Student@1234"),
                first_name=first,
                last_name=last,
                phone=f"+1 (555) 01{idx:02d}-9941",
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True
            )
            db.add(s_user)
            db.commit()
            all_student_users.append(s_user)

            db.add(StudentProfile(
                user_id=s_user.id,
                student_id_number=f"STU2026-{idx:04d}",
                department=dept,
                batch_year=2026,
                gpa=gpa,
                bio=f"Passionate {dept} student focused on building robust scalable systems. Seeking challenging internship opportunities.",
                resume_url=f"/api/v1/files/download/{first.lower()}_{last.lower()}_resume.pdf",
                resume_filename=f"{first}_{last}_Resume.pdf",
                resume_updated_at=datetime.utcnow() - timedelta(days=random.randint(1, 20)),
                skills=skills,
                placement_status=PlacementStatus.PLACED if idx % 5 == 0 else PlacementStatus.NOT_PLACED
            ))
        db.commit()

        # 4. 10 Realistic Companies
        companies_data = [
            ("Apex Cloud Technologies", "US-DEL-984712", "Cloud & Enterprise SaaS", "https://apexcloud.example.com", "Seattle, WA", "Apex Cloud provides enterprise-grade kubernetes hosting and autonomous cloud governance platforms."),
            ("Quantum Nexus Labs", "US-CA-551029", "Artificial Intelligence & Robotics", "https://quantumnexus.example.com", "San Francisco, CA", "Pioneering next-generation transformer models, autonomous robotics, and edge intelligence systems."),
            ("Vanguard Financial Tech", "US-NY-339182", "Fintech & Algorithmic Trading", "https://vanguardfin.example.com", "New York, NY", "Institutional financial infrastructure delivering ultra-low-latency market connectivity and risk engines."),
            ("CyberShield Defense Systems", "US-VA-881923", "Cybersecurity & InfoSec", "https://cybershield.example.com", "McLean, VA", "Defending critical cyber assets, cloud perimeter defense, zero-trust networks, and threat intelligence."),
            ("BioGenix Healthcare Analytics", "US-MA-449102", "HealthTech & Bioinformatics", "https://biogenix.example.com", "Boston, MA", "Accelerating precision medicine and clinical trials through clinical data pipelines and AI diagnosis models."),
            ("InfraScale High-Performance Systems", "US-TX-772910", "Systems & Hardware Infrastructure", "https://infrascale.example.com", "Austin, TX", "Engineering ultra-scalable telemetry, data center automation, and hardware-accelerated computing engines."),
            ("Starlight Interactive Digital", "US-CA-221948", "Interactive Media & Gaming Tech", "https://starlight.example.com", "Los Angeles, CA", "Real-time 3D simulation, spatial audio computing, and cross-platform multiplayer experiences."),
            ("Pulse Robotics Corporation", "US-PA-661094", "Industrial Automation & Robotics", "https://pulserobotics.example.com", "Pittsburgh, PA", "Autonomous mobile robots and computer vision systems powering smart warehouses and precision manufacturing."),
            ("Hyperion Renewable CleanEnergy", "US-CO-119284", "CleanTech & Smart Grid Energy", "https://hyperionenergy.example.com", "Denver, CO", "Predictive smart grid software, renewable storage balancing, and carbon emission analytics."),
            ("Aether Design Studio & Labs", "US-IL-992019", "Product Design & HCI Systems", "https://aetherdesign.example.com", "Chicago, IL", "Award-winning product studio creating enterprise human-computer interfaces and accessibility technologies.")
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

            # Add primary contact
            db.add(CompanyContact(
                company_id=comp.id,
                contact_name=f"Director of University Recruiting",
                email=f"careers@{name.lower().split()[0]}.example.com",
                phone="+1 (555) 012-3456",
                designation="University Relations Lead",
                is_primary=True
            ))

            # Add realistic ratings from students
            for _ in range(3):
                student_rater = random.choice(all_student_users)
                db.add(CompanyRating(
                    company_id=comp.id,
                    student_id=student_rater.id,
                    culture_rating=random.randint(4, 5),
                    mentorship_rating=random.randint(4, 5),
                    learning_rating=random.randint(4, 5),
                    work_env_rating=random.randint(4, 5),
                    overall_rating=random.randint(4, 5),
                    review="Exceptional mentorship program with senior engineers. Real responsibilities from week one and a very collaborative work environment."
                ))
        db.commit()

        # 5. 20 Realistic Internship Opportunities
        internships_spec = [
            ("Apex Cloud Technologies", "Cloud Infrastructure Engineering Intern", "Software Engineering", WorkMode.REMOTE, 2800.0, 12, 3, ["Go", "Kubernetes", "AWS", "Terraform"]),
            ("Apex Cloud Technologies", "Site Reliability Engineering (SRE) Intern", "DevOps & Cloud", WorkMode.HYBRID, 2600.0, 14, 2, ["Linux", "Python", "Prometheus", "Docker"]),
            ("Quantum Nexus Labs", "Machine Learning Research Intern", "Artificial Intelligence", WorkMode.ON_SITE, 3500.0, 16, 2, ["PyTorch", "Python", "Transformers", "CUDA"]),
            ("Quantum Nexus Labs", "Computer Vision Systems Intern", "Artificial Intelligence", WorkMode.HYBRID, 3200.0, 12, 1, ["OpenCV", "Python", "Deep Learning", "C++"]),
            ("Vanguard Financial Tech", "Quantitative Software Engineer Intern", "Fintech", WorkMode.ON_SITE, 3800.0, 10, 4, ["C++", "Python", "Algorithms", "Low Latency"]),
            ("Vanguard Financial Tech", "Full-Stack Web Platforms Intern", "Software Engineering", WorkMode.HYBRID, 2900.0, 12, 2, ["React", "TypeScript", "Node.js", "PostgreSQL"]),
            ("CyberShield Defense Systems", "Security Operations & PenTesting Intern", "Cybersecurity", WorkMode.ON_SITE, 2700.0, 12, 3, ["Network Security", "Linux", "Python", "SIEM"]),
            ("CyberShield Defense Systems", "Cloud Security Automation Intern", "Cybersecurity", WorkMode.REMOTE, 2950.0, 14, 2, ["AWS Security", "Python", "Terraform", "IAM"]),
            ("BioGenix Healthcare Analytics", "Bioinformatics Data Science Intern", "Data Science", WorkMode.HYBRID, 2750.0, 16, 2, ["Python", "R", "Pandas", "Bioinformatics"]),
            ("BioGenix Healthcare Analytics", "Healthcare Data Pipeline Engineer Intern", "Data Engineering", WorkMode.REMOTE, 2600.0, 12, 1, ["SQL", "Python", "ETL", "Spark"]),
            ("InfraScale High-Performance Systems", "Kernel & Systems Software Intern", "Systems Engineering", WorkMode.ON_SITE, 3100.0, 16, 2, ["C", "Linux Kernel", "Memory Management"]),
            ("InfraScale High-Performance Systems", "Distributed Storage Systems Intern", "Software Engineering", WorkMode.HYBRID, 3000.0, 14, 3, ["Go", "Distributed Systems", "RPC", "Raft"]),
            ("Starlight Interactive Digital", "Graphics & Game Engine Programmer Intern", "Graphics & Gaming", WorkMode.ON_SITE, 2800.0, 12, 2, ["C++", "DirectX/Vulkan", "Shaders", "Math"]),
            ("Starlight Interactive Digital", "Backend Multiplayer Services Intern", "Software Engineering", WorkMode.HYBRID, 2700.0, 12, 2, ["Node.js", "WebSockets", "Redis", "Docker"]),
            ("Pulse Robotics Corporation", "Autonomous Navigation Systems Intern", "Robotics", WorkMode.ON_SITE, 3300.0, 16, 2, ["ROS2", "Python", "C++", "SLAM"]),
            ("Pulse Robotics Corporation", "Embedded Firmware Engineer Intern", "Embedded Systems", WorkMode.ON_SITE, 2900.0, 12, 2, ["C", "RTOS", "Microcontrollers", "I2C"]),
            ("Hyperion Renewable CleanEnergy", "Smart Grid IoT Data Analyst Intern", "CleanTech", WorkMode.HYBRID, 2500.0, 12, 3, ["Python", "SQL", "Time-series Analysis", "Tableau"]),
            ("Hyperion Renewable CleanEnergy", "Full-Stack Energy Analytics Intern", "Software Engineering", WorkMode.REMOTE, 2650.0, 14, 2, ["React", "FastAPI", "PostgreSQL", "Charts"]),
            ("Aether Design Studio & Labs", "Design Systems Engineer Intern", "UI/UX & Frontend", WorkMode.HYBRID, 2700.0, 12, 2, ["Figma", "React", "TypeScript", "Tailwind CSS"]),
            ("Aether Design Studio & Labs", "Accessible Web Experiences Intern", "UI/UX & Frontend", WorkMode.REMOTE, 2400.0, 10, 1, ["Accessibility (a11y)", "HTML/CSS", "JavaScript"])
        ]

        created_internships = []
        comp_map = {c.name: c for c in created_companies}

        for comp_name, title, domain, mode, stipend, duration, openings, skills in internships_spec:
            company_obj = comp_map[comp_name]
            start_d = date.today() + timedelta(days=45)
            end_d = start_d + timedelta(weeks=duration)
            deadline = date.today() + timedelta(days=25)

            internship = Internship(
                company_id=company_obj.id,
                posted_by_user_id=faculty_user.id,
                title=title,
                domain=domain,
                description=f"Join {comp_name} for an immersive {duration}-week internship. You will collaborate directly with seasoned principal engineers to solve mission-critical challenges in {domain.lower()}.",
                responsibilities="• Design and implement production features following clean architecture standards.\n• Write comprehensive automated unit and integration tests.\n• Participate in sprint planning, architectural design reviews, and daily standups.\n• Present end-of-internship capstone project to executive leadership.",
                requirements=f"• Enrolled in a Bachelor's or Master's degree in Computer Science, Engineering, or related technical field.\n• Strong foundation in {', '.join(skills[:2])}.\n• GPA of 3.0 or higher preferred.\n• Demonstrated passion for solving complex technical problems.",
                eligibility_criteria="Available full-time during the designated term. Authorized to work or qualifying for academic curricular practical training.",
                benefits=f"• Competitive monthly stipend of ${stipend:,.0f} USD.\n• Dedicated 1-on-1 mentorship from a senior staff engineer.\n• Full access to company technical libraries and cloud credits.\n• High consideration for full-time post-graduation offer.",
                location=company_obj.location,
                work_mode=mode,
                stipend_amount=stipend,
                stipend_currency="USD",
                duration_weeks=duration,
                openings=openings,
                start_date=start_d,
                end_date=end_d,
                application_deadline=deadline,
                skills_required=skills,
                status=InternshipStatus.APPROVED,
                is_featured=(stipend >= 3000.0)
            )
            db.add(internship)
            db.commit()
            created_internships.append(internship)

        # 6. Realistic Applications, Timelines, Interviews & Evaluations
        print("📝 Generating realistic applications, interviews, and evaluations...")

        # Application 1: Aiden Reynolds -> Apex Cloud Infrastructure Intern (ACCEPTED)
        app1 = Application(
            internship_id=created_internships[0].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aiden_reynolds_resume.pdf",
            cover_letter="I am enthusiastic about applying for the Cloud Infrastructure Engineering Internship at Apex Cloud Technologies. Having architected distributed microservices and container orchestration platforms in university projects, I am eager to contribute to your core governance infrastructure.",
            qualifications={"gpa": 3.88, "degree": "B.S. Computer Science", "graduation_year": 2026, "relevant_coursework": "Operating Systems, Distributed Systems, Cloud Computing"},
            status=ApplicationStatus.ACCEPTED,
            faculty_notes="Exceptional candidate with stellar systems architecture knowledge and top-tier interview performance.",
            faculty_rating=5
        )
        db.add(app1)
        db.commit()

        # Timelines for app1
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.PENDING, comment="Application received", changed_by_user_id=primary_student.id, created_at=datetime.utcnow() - timedelta(days=14)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.SHORTLISTED, comment="Shortlisted for preliminary screening", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=10)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.INTERVIEW_SCHEDULED, comment="Technical interview scheduled", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=7)))
        db.add(ApplicationStatusHistory(application_id=app1.id, status=ApplicationStatus.ACCEPTED, comment="Official internship offer extended by Apex Cloud Technologies", changed_by_user_id=admin_user.id, created_at=datetime.utcnow() - timedelta(days=1)))
        db.commit()

        # Interview for app1 (Completed, Passed)
        iv1 = Interview(
            application_id=app1.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Sarah Jenkins (Principal Cloud Architect)",
            interviewer_email="sarah.jenkins@apexcloud.example.com",
            round_name="Technical Architecture & Systems Coding",
            scheduled_at=datetime.utcnow() - timedelta(days=4),
            duration_minutes=60,
            location_or_link="Google Meet: https://meet.google.com/apx-cld-eng",
            status=InterviewStatus.COMPLETED,
            feedback="Aiden showed deep understanding of Raft consensus, Go concurrency primitives, and Kubernetes custom resource definitions.",
            result=InterviewResult.PASSED
        )
        db.add(iv1)
        db.commit()

        # Evaluation for app1
        db.add(Evaluation(
            application_id=app1.id,
            internship_id=app1.internship_id,
            student_id=app1.student_id,
            evaluator_user_id=faculty_user.id,
            technical_score=5,
            communication_score=5,
            problem_solving_score=5,
            teamwork_score=4,
            punctuality_score=5,
            responsibility_score=5,
            learning_ability_score=5,
            overall_score=4.86,
            strengths="In-depth technical knowledge of distributed systems, outstanding communication, and structured approach to debugging.",
            areas_for_improvement="Continue exploring eBPF and advanced kernel observability.",
            comments="Unanimous recommendation for placement offer.",
            hiring_recommendation=HiringRecommendation.STRONGLY_RECOMMEND
        ))

        # Application 2: Aiden Reynolds -> Quantum Nexus Machine Learning (SHORTLISTED)
        app2 = Application(
            internship_id=created_internships[2].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aiden_reynolds_resume.pdf",
            cover_letter="My background in parallel computing and deep learning makes me excited about research at Quantum Nexus Labs.",
            qualifications={"gpa": 3.88, "degree": "B.S. Computer Science"},
            status=ApplicationStatus.SHORTLISTED,
            faculty_notes="Resume approved by faculty coordinator; awaiting company schedule.",
            faculty_rating=4
        )
        db.add(app2)
        db.commit()

        db.add(ApplicationStatusHistory(application_id=app2.id, status=ApplicationStatus.PENDING, comment="Application submitted", changed_by_user_id=primary_student.id, created_at=datetime.utcnow() - timedelta(days=6)))
        db.add(ApplicationStatusHistory(application_id=app2.id, status=ApplicationStatus.SHORTLISTED, comment="Candidate shortlisted based on technical credentials", changed_by_user_id=faculty_user.id, created_at=datetime.utcnow() - timedelta(days=2)))
        db.commit()

        # Upcoming Interview for app2
        db.add(Interview(
            application_id=app2.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Dr. Aris Thorne (Head of Robotics AI)",
            interviewer_email="aris.thorne@quantumnexus.example.com",
            round_name="Machine Learning Algorithms & Research Deep Dive",
            scheduled_at=datetime.utcnow() + timedelta(days=3, hours=4),
            duration_minutes=45,
            location_or_link="Zoom: https://quantumnexus.zoom.us/j/849201849",
            status=InterviewStatus.SCHEDULED,
            result=InterviewResult.PENDING
        ))

        # Application 3: Aiden Reynolds -> Vanguard Quantitative Software Engineer (INTERVIEW_SCHEDULED)
        app3 = Application(
            internship_id=created_internships[4].id,
            student_id=primary_student.id,
            resume_url="/api/v1/files/download/aiden_reynolds_resume.pdf",
            cover_letter="Passionate about low-latency algorithms and high-frequency order execution systems.",
            qualifications={"gpa": 3.88, "skills": ["C++", "Python", "Algorithms"]},
            status=ApplicationStatus.INTERVIEW_SCHEDULED,
            faculty_notes="Strong algorithmic background.",
            faculty_rating=4
        )
        db.add(app3)
        db.commit()

        db.add(Interview(
            application_id=app3.id,
            scheduled_by_user_id=faculty_user.id,
            interviewer_name="Michael Sterling (VP Quantitative Development)",
            interviewer_email="michael.s@vanguardfin.example.com",
            round_name="Algorithms & Data Structures Round",
            scheduled_at=datetime.utcnow() + timedelta(days=5, hours=2),
            duration_minutes=60,
            location_or_link="Google Meet: https://meet.google.com/van-quant-tech",
            status=InterviewStatus.SCHEDULED,
            result=InterviewResult.PENDING
        ))

        # Additional 25 applications across other students to provide rich realistic numbers
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
                resume_url=f"/api/v1/files/download/{student.first_name.lower()}_resume.pdf",
                cover_letter=f"Dear Hiring Committee, I am writing to express my eager interest in the {target_internship.title} position at {target_internship.company.name}. My academic background in {student.student_profile.department} and hands-on projects align directly with your requirements.",
                qualifications={"gpa": student.student_profile.gpa, "department": student.student_profile.department},
                status=selected_status,
                faculty_notes="Candidate reviewed and verified by department placement advisor.",
                faculty_rating=random.randint(3, 5)
            )
            db.add(app)
            db.commit()

            # Status history
            db.add(ApplicationStatusHistory(
                application_id=app.id,
                status=ApplicationStatus.PENDING,
                comment="Initial application registered",
                changed_by_user_id=student.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 20))
            ))

            if selected_status != ApplicationStatus.PENDING:
                db.add(ApplicationStatusHistory(
                    application_id=app.id,
                    status=selected_status,
                    comment=f"Application marked as {selected_status.value}",
                    changed_by_user_id=faculty_user.id,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 8))
                ))

            # If interview scheduled or accepted, add interview
            if selected_status in [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.ACCEPTED]:
                db.add(Interview(
                    application_id=app.id,
                    scheduled_by_user_id=faculty_user.id,
                    interviewer_name=f"Lead Architect @ {target_internship.company.name}",
                    interviewer_email=f"interviews@{target_internship.company.name.lower().split()[0]}.example.com",
                    round_name="Technical & Culture Alignment",
                    scheduled_at=datetime.utcnow() + timedelta(days=random.randint(2, 7), hours=random.randint(9, 16)),
                    duration_minutes=45,
                    location_or_link=f"Google Meet / Room {random.randint(101, 305)}",
                    status=InterviewStatus.SCHEDULED if selected_status == ApplicationStatus.INTERVIEW_SCHEDULED else InterviewStatus.COMPLETED,
                    result=InterviewResult.PENDING if selected_status == ApplicationStatus.INTERVIEW_SCHEDULED else InterviewResult.PASSED
                ))

            # If accepted, add evaluation
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
                    overall_score=round(random.uniform(4.2, 4.9), 2),
                    strengths="Strong problem formulation skills, dependable team player, quick adaptation.",
                    comments="Recommended for placement.",
                    hiring_recommendation=HiringRecommendation.RECOMMEND
                ))

        db.commit()

        # 7. Notifications for Primary Student
        db.add(Notification(
            user_id=primary_student.id,
            title="Internship Offer Extended! 🎉",
            message="Congratulations! Apex Cloud Technologies has officially accepted your application for Cloud Infrastructure Engineering Intern.",
            category=NotificationCategory.APPLICATION,
            link="/student/applications",
            is_read=False
        ))
        db.add(Notification(
            user_id=primary_student.id,
            title="Interview Invitation: Quantum Nexus Labs",
            message="You have an upcoming Machine Learning Algorithms interview with Dr. Aris Thorne scheduled in 3 days.",
            category=NotificationCategory.INTERVIEW,
            link="/student/interviews",
            is_read=False
        ))
        db.add(Notification(
            user_id=primary_student.id,
            title="Evaluation Report Available",
            message="Faculty coordinator Prof. Marcus Sterling has submitted your evaluation with an overall score of 4.86/5.0.",
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
            title="Incredible Recruitment Experience at Apex Cloud",
            comment="The interview process was rigorous yet respectful. Feedback was timely and the engineering team demonstrated high technical standards.",
            status=FeedbackStatus.RESOLVED,
            admin_response="Thank you for sharing your experience. We are proud of our industry partnership with Apex Cloud."
        ))
        db.add(Feedback(
            from_user_id=primary_student.id,
            target_type=FeedbackTargetType.SYSTEM,
            rating=5,
            title="Platform UI & Tracking Experience",
            comment="The application tracking timeline and notifications make keeping track of interviews effortless. Excellent experience!",
            status=FeedbackStatus.SUBMITTED
        ))

        # 9. Audit Logs
        db.add(AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            details="College Internship Management System database initialized with production seeds."
        ))
        db.add(AuditLog(
            user_id=faculty_user.id,
            user_email=faculty_user.email,
            action="CREATE_INTERNSHIP",
            entity_type="INTERNSHIP",
            details="Created 20 corporate internship postings."
        ))
        db.add(AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="APPROVE_INTERNSHIP",
            entity_type="INTERNSHIP",
            details="Approved all verified partner company internship opportunities."
        ))

        # 10. Bookmarks for primary student
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[0].id))
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[2].id))
        db.add(Bookmark(user_id=primary_student.id, internship_id=created_internships[4].id))

        db.commit()
        print("✅ Database seeding successfully finished!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
