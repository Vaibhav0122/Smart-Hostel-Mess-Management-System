import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { env } from "../config/env";
import { User } from "../models/User";
import { StudentProfile } from "../models/StudentProfile";
import { Hostel } from "../models/Hostel";
import { Building } from "../models/Building";
import { Room } from "../models/Room";
import { Bed } from "../models/Bed";
import { BedAllocation } from "../models/BedAllocation";
import { Contract } from "../models/Contract";
import { ChargeRecord, ChargeType, ChargeStatus } from "../models/ChargeRecord";
import { PaymentTransaction, PaymentMethod, PaymentStatus } from "../models/PaymentTransaction";
import { Menu, MealType } from "../models/Menu";
import { UserRole, UserStatus } from "../constants/roles";
import { ROLE_PERMISSIONS } from "../constants/permissions";
import { hashPassword } from "../utils/password";
import { AuthService } from "../services/auth.service";

async function seedDevUsers() {
  console.log("\n========================================================");
  console.log("  NESTORA — Smart Hostel Living: Development Seed Script  ");
  console.log("========================================================\n");

  // 1. Strict production environment protection
  if (env.NODE_ENV === "production" || process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to run dev seed script in PRODUCTION environment.");
    process.exit(1);
  }

  // 2. Connect to MongoDB
  console.log(`Connecting to MongoDB at: ${env.MONGODB_URI}...`);
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  // Test credentials definitions
  const adminCredentials = {
    email: "admin@nestora.local",
    password: "NestoraAdmin@2026",
    role: UserRole.SUPER_ADMIN,
    name: "System Administrator",
  };

  const studentCredentials = {
    email: "student@nestora.local",
    studentId: "STU-202610001",
    password: "NestoraStudent@2026",
    role: UserRole.STUDENT,
    name: "Aarav Sharma",
  };

  // 3. Provision Admin Account
  console.log("--------------------------------------------------------");
  console.log("1. Provisioning Test Administrator Account...");
  const adminPasswordHash = await hashPassword(adminCredentials.password);

  let adminUser = await User.findOne({ email: adminCredentials.email });
  if (!adminUser) {
    adminUser = await User.create({
      email: adminCredentials.email,
      passwordHash: adminPasswordHash,
      role: adminCredentials.role,
      status: UserStatus.ACTIVE,
      studentId: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    console.log(`   Created admin account: ${adminUser.email}`);
  } else {
    adminUser.passwordHash = adminPasswordHash;
    adminUser.status = UserStatus.ACTIVE;
    adminUser.failedLoginAttempts = 0;
    adminUser.lockUntil = null;
    await adminUser.save();
    console.log(`   Updated existing admin account password: ${adminUser.email}`);
  }

  // Also ensure existing admin@smarthostel.edu has the same password for convenience if it exists
  const legacyAdmin = await User.findOne({ email: "admin@smarthostel.edu" });
  if (legacyAdmin) {
    legacyAdmin.passwordHash = adminPasswordHash;
    legacyAdmin.status = UserStatus.ACTIVE;
    legacyAdmin.failedLoginAttempts = 0;
    legacyAdmin.lockUntil = null;
    await legacyAdmin.save();
    console.log("   Updated legacy admin account (admin@smarthostel.edu) with the same password.");
  }

  // 4. Provision Student Account
  console.log("\n2. Provisioning Test Student Account...");
  const studentPasswordHash = await hashPassword(studentCredentials.password);

  let studentUser = await User.findOne({ email: studentCredentials.email });
  if (!studentUser) {
    studentUser = await User.create({
      email: studentCredentials.email,
      studentId: studentCredentials.studentId,
      passwordHash: studentPasswordHash,
      role: studentCredentials.role,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    console.log(`   Created student user: ${studentUser.email} (ID: ${studentUser.studentId})`);
  } else {
    studentUser.passwordHash = studentPasswordHash;
    studentUser.studentId = studentCredentials.studentId;
    studentUser.status = UserStatus.ACTIVE;
    studentUser.failedLoginAttempts = 0;
    studentUser.lockUntil = null;
    await studentUser.save();
    console.log(`   Updated student user: ${studentUser.email} (ID: ${studentUser.studentId})`);
  }

  // 5. Ensure StudentProfile is populated and valid
  console.log("\n3. Verifying Student Profile...");
  let profile = await StudentProfile.findOne({ userId: studentUser._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: studentUser._id,
      fullName: studentCredentials.name,
      registeredPhone: "+919876543210",
      alternatePhone: "+919876543219",
      dateOfBirth: new Date("2004-05-15"),
      gender: "MALE",
      bloodGroup: "O+",
      dietaryPreference: "VEGETARIAN",
      academicInfo: {
        rollNumber: "CS-2026-089",
        course: "B.Tech Computer Science & Engineering",
        branch: "CSE",
        yearOfStudy: 3,
      },
      addresses: {
        permanent: {
          street: "42 Lakeview Enclave, Outer Ring Road",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
        },
        current: {
          street: "Room 101, Nilgiri Heights, Campus East",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
        },
      },
      emergencyContact: {
        name: "Ramesh Sharma",
        relationship: "Father",
        phone: "+919876543211",
        email: "ramesh.sharma@example.com",
      },
      bankDetails: {
        accountHolderName: studentCredentials.name,
        maskedAccountNumber: "XXXX-XXXX-4589",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
      },
      kycDocuments: [
        {
          documentType: "COLLEGE_ID",
          maskedIdNumber: "CS-XXXX-089",
          fileKey: "kyc/sample-college-id.pdf",
          fileName: "college_id.pdf",
          fileMimeType: "application/pdf",
          fileSize: 124000,
          verified: true,
          verifiedByAdminId: adminUser._id,
          verifiedAt: new Date(),
          uploadedAt: new Date(),
        },
      ],
    });
    console.log(`   Created student profile for ${profile.fullName}`);
  } else {
    profile.fullName = studentCredentials.name;
    profile.registeredPhone = "+919876543210";
    await profile.save();
    console.log(`   Existing student profile verified for ${profile.fullName}`);
  }

  // 6. Provision Sample Hostel, Room, Bed, Contract and Payments if not present
  console.log("\n4. Checking Hostel Accommodation & Contracts for Student...");
  let hostel = await Hostel.findOne({ code: "NLH-01" });
  if (!hostel) {
    hostel = await Hostel.create({
      name: "Nilgiri Heights Hostel",
      code: "NLH-01",
      genderType: "CO_ED",
      wardenInChargeId: adminUser._id,
      contactPhone: "+918023456789",
      contactEmail: "nilgiri.warden@smarthostel.edu",
      address: {
        street: "East Campus Boulevard",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      amenities: ["Wi-Fi", "Study Lounge", "Dining Hall", "Gymnasium", "24/7 Power Backup"],
      isActive: true,
    });
    console.log(`   Created hostel: ${hostel.name}`);
  }

  let building = await Building.findOne({ hostelId: hostel._id, name: "Block A" });
  if (!building) {
    building = await Building.create({
      hostelId: hostel._id,
      name: "Block A",
      totalFloors: 4,
      status: "ACTIVE",
    });
    console.log(`   Created building: ${building.name}`);
  }

  let room = await Room.findOne({ hostelId: hostel._id, roomNumber: "101" });
  if (!room) {
    room = await Room.create({
      hostelId: hostel._id,
      buildingId: building._id,
      roomNumber: "101",
      floor: 1,
      roomType: "DOUBLE",
      capacity: 2,
      occupiedBeds: 1,
      baseMonthlyRent: 6500,
      status: "AVAILABLE",
    });
    console.log(`   Created room: ${room.roomNumber}`);
  }

  let bed = await Bed.findOne({ roomId: room._id, bedLabel: "BED-A" });
  if (!bed) {
    bed = await Bed.create({
      roomId: room._id,
      buildingId: building._id,
      hostelId: hostel._id,
      bedLabel: "BED-A",
      status: "OCCUPIED",
    });
    console.log(`   Created bed: ${bed.bedLabel}`);
  }

  // Bed allocation
  let allocation = await BedAllocation.findOne({ studentId: studentUser._id, status: "ACTIVE" });
  if (!allocation) {
    allocation = await BedAllocation.create({
      studentId: studentUser._id,
      hostelId: hostel._id,
      buildingId: building._id,
      roomId: room._id,
      bedId: bed._id,
      startDate: dayjs().subtract(30, "day").toDate(),
      status: "ACTIVE",
      allocatedByAdminId: adminUser._id,
      remarks: "Academic year 2026-27 room allocation",
    });
    bed.currentAllocationId = allocation._id as mongoose.Types.ObjectId;
    await bed.save();
    console.log(`   Created active bed allocation in Room 101, Bed-A`);
  }

  // Contract
  let contract = await Contract.findOne({ studentId: studentUser._id, status: "ACTIVE" });
  if (!contract) {
    contract = await Contract.create({
      studentId: studentUser._id,
      hostelId: hostel._id,
      roomId: room._id,
      bedId: bed._id,
      startDate: dayjs().subtract(30, "day").toDate(),
      endDate: dayjs().add(9, "month").toDate(),
      tenureMonths: 10,
      lockInUntilDate: dayjs().add(3, "month").toDate(),
      noticePeriodDays: 30,
      monthlyRentAmount: 6500,
      securityDepositAmount: 10000,
      includedServices: ["Accommodation", "High-speed Wi-Fi", "Daily Mess Breakfast & Dinner", "Housekeeping"],
      status: "ACTIVE",
      duesCleared: true,
      duesClearedAt: new Date(),
    });
    console.log(`   Created active hostel contract for ${studentCredentials.name}`);
  }

  // Sample charge and payment
  let charge = await ChargeRecord.findOne({ studentId: studentUser._id });
  if (!charge) {
    charge = await ChargeRecord.create({
      chargeNumber: `CHG-${dayjs().format("YYYYMM")}-001`,
      studentId: studentUser._id,
      contractId: contract._id,
      chargeType: ChargeType.MONTHLY_RENT,
      billingPeriod: dayjs().format("MMMM YYYY"),
      amount: 6500,
      dueDate: dayjs().add(5, "day").toDate(),
      status: ChargeStatus.PAID,
      amountPaid: 6500,
      generatedByAdminId: adminUser._id,
      notes: "Standard monthly hostel fee",
    });

    await PaymentTransaction.create({
      receiptNumber: `REC-${dayjs().format("YYYYMM")}-001`,
      studentId: studentUser._id,
      chargeRecordId: charge._id,
      amountPaid: 6500,
      paymentMethod: PaymentMethod.UPI,
      referenceNumber: "UPI-AXIS-9821837492",
      paymentDate: new Date(),
      recordedByAdminId: adminUser._id,
      status: PaymentStatus.SUCCESS,
      isReversal: false,
      notes: "Online UPI payment received",
    });
    console.log(`   Created sample charge & payment records for transparent financial history.`);
  }

  // 7. Seed rolling 3-day menu for mess if not already present
  console.log("\n5. Checking Mess Menus for Upcoming Days...");
  try {
    await mongoose.connection.collection("menus").dropIndex("dayOfWeek_1");
  } catch {
    // Legacy index already dropped or not present
  }
  const todayStr = dayjs().format("YYYY-MM-DD");
  const tomorrowStr = dayjs().add(1, "day").format("YYYY-MM-DD");
  const dayAfterStr = dayjs().add(2, "day").format("YYYY-MM-DD");

  const datesToSeed = [
    {
      date: todayStr,
      breakfast: { title: "South Indian Breakfast", items: ["Steamed Idli", "Medu Vada", "Coconut Chutney", "Sambar", "Filter Coffee"] },
      lunch: { title: "Standard Thali", items: ["Paneer Butter Masala", "Dal Tadka", "Steamed Basmati Rice", "Chapati", "Mixed Salad", "Gulab Jamun"] },
      snacks: { title: "Evening Refreshments", items: ["Vegetable Samosa", "Mint Chutney", "Masala Chai"] },
      dinner: { title: "Light Dinner", items: ["Aloo Gobi", "Yellow Moong Dal", "Phulka", "Jeera Rice", "Papad"] },
    },
    {
      date: tomorrowStr,
      breakfast: { title: "North Indian Breakfast", items: ["Aloo Paratha", "Curd", "Mixed Pickle", "Masala Tea"] },
      lunch: { title: "Special Lunch", items: ["Chole Bhature", "Jeera Pulao", "Boondi Raita", "Kachumber Salad"] },
      snacks: { title: "Tea Time", items: ["Poha with Sev", "Lemon Tea"] },
      dinner: { title: "Comfort Dinner", items: ["Rajma Masala", "Steamed Rice", "Roti", "Fresh Green Salad"] },
    },
    {
      date: dayAfterStr,
      breakfast: { title: "Continental & Indian Fusion", items: ["Masala Upma", "Bread Butter Jam", "Boiled Eggs / Sprouts", "Tea/Coffee"] },
      lunch: { title: "Homestyle Meal", items: ["Matar Paneer", "Dal Makhani", "Tandoori Roti", "Veg Pulao", "Kheer"] },
      snacks: { title: "Evening Snack", items: ["Veg Cutlet", "Tomato Ketchup", "Ginger Tea"] },
      dinner: { title: "Weekend Special", items: ["Veg Biryani", "Mirchi Ka Salan", "Raita", "Ice Cream"] },
    },
  ];

  for (const dayPlan of datesToSeed) {
    const existingMenu = await Menu.findOne({ hostelId: hostel._id, mealDate: dayPlan.date });
    if (!existingMenu) {
      await Menu.create([
        {
          hostelId: hostel._id,
          mealDate: dayPlan.date,
          dateAnchor: dayjs(dayPlan.date).toDate(),
          mealType: MealType.BREAKFAST,
          title: dayPlan.breakfast.title,
          items: dayPlan.breakfast.items,
          isSpecialMeal: false,
          dietaryTags: ["VEG"],
          createdByAdminId: adminUser._id,
        },
        {
          hostelId: hostel._id,
          mealDate: dayPlan.date,
          dateAnchor: dayjs(dayPlan.date).toDate(),
          mealType: MealType.LUNCH,
          title: dayPlan.lunch.title,
          items: dayPlan.lunch.items,
          isSpecialMeal: true,
          dietaryTags: ["VEG"],
          createdByAdminId: adminUser._id,
        },
        {
          hostelId: hostel._id,
          mealDate: dayPlan.date,
          dateAnchor: dayjs(dayPlan.date).toDate(),
          mealType: MealType.SNACKS,
          title: dayPlan.snacks.title,
          items: dayPlan.snacks.items,
          isSpecialMeal: false,
          dietaryTags: ["VEG"],
          createdByAdminId: adminUser._id,
        },
        {
          hostelId: hostel._id,
          mealDate: dayPlan.date,
          dateAnchor: dayjs(dayPlan.date).toDate(),
          mealType: MealType.DINNER,
          title: dayPlan.dinner.title,
          items: dayPlan.dinner.items,
          isSpecialMeal: false,
          dietaryTags: ["VEG"],
          createdByAdminId: adminUser._id,
        },
      ]);
      console.log(`   Seeded 4 daily menus for date: ${dayPlan.date}`);
    }
  }

  // 8. Verify Authentication & Permissions for Both Accounts
  console.log("\n6. Verifying Authentication & Role-Based Permissions...");

  // Verify Admin Login
  const adminLoginResult = await AuthService.login({
    identifier: adminCredentials.email,
    password: adminCredentials.password,
  });
  console.log(`   ✓ Admin authentication successful! Role: ${adminLoginResult.user.role}`);
  console.log(`   ✓ Admin permissions count: ${ROLE_PERMISSIONS[adminCredentials.role].length} permissions.`);

  // Verify Student Login via Email
  const studentEmailLoginResult = await AuthService.login({
    identifier: studentCredentials.email,
    password: studentCredentials.password,
  });
  console.log(`   ✓ Student authentication via email successful! Role: ${studentEmailLoginResult.user.role}`);

  // Verify Student Login via Student ID
  const studentIdLoginResult = await AuthService.login({
    identifier: studentCredentials.studentId,
    password: studentCredentials.password,
  });
  console.log(`   ✓ Student authentication via Student ID (${studentIdLoginResult.user.studentId}) successful!`);
  console.log(`   ✓ Student permissions count: ${ROLE_PERMISSIONS[studentCredentials.role].length} permissions.`);

  // 9. Save credentials locally to a git-ignored file
  const credentialsFilePath = path.join(process.cwd(), "test-credentials.local.json");
  const credentialsData = {
    generatedAt: new Date().toISOString(),
    environment: env.NODE_ENV,
    admin: {
      accountType: "Administrator / Super Admin",
      email: adminCredentials.email,
      password: adminCredentials.password,
      role: adminCredentials.role,
      alternativeEmail: "admin@smarthostel.edu",
      permissions: ROLE_PERMISSIONS[adminCredentials.role],
    },
    student: {
      accountType: "Student",
      email: studentCredentials.email,
      studentId: studentCredentials.studentId,
      password: studentCredentials.password,
      role: studentCredentials.role,
      fullName: studentCredentials.name,
      room: "Room 101, Bed-A (Nilgiri Heights)",
      permissions: ROLE_PERMISSIONS[studentCredentials.role],
    },
    loginUrl: "http://localhost:5173",
  };

  fs.writeFileSync(credentialsFilePath, JSON.stringify(credentialsData, null, 2), "utf-8");
  console.log(`\n7. Credentials saved to Git-ignored local file:`);
  console.log(`   ${credentialsFilePath}\n`);

  console.log("========================================================");
  console.log("           TEST ACCOUNTS READY FOR LOGIN                ");
  console.log("========================================================");
  console.log("\n🏢 1. ADMINISTRATOR ACCOUNT:");
  console.log(`   Login ID (Email): ${adminCredentials.email}`);
  console.log(`   Alternative ID:   admin@smarthostel.edu`);
  console.log(`   Password:         ${adminCredentials.password}`);
  console.log(`   Role:             ${adminCredentials.role}`);
  console.log(`   Access:           Admin Dashboard, Occupancy, KPIs, Reports & CSV Exports\n`);

  console.log("🎓 2. STUDENT ACCOUNT:");
  console.log(`   Login ID (Email): ${studentCredentials.email}`);
  console.log(`   Or Student ID:    ${studentCredentials.studentId}`);
  console.log(`   Password:         ${studentCredentials.password}`);
  console.log(`   Role:             ${studentCredentials.role}`);
  console.log(`   Resident:         ${studentCredentials.name} (Room 101, Nilgiri Heights)`);
  console.log(`   Access:           Student Dashboard, Room details, Dues, Daily Menus & Meal Selection\n`);

  console.log("========================================================\n");

  await mongoose.disconnect();
}

seedDevUsers().catch((err) => {
  console.error("❌ Seed script error:", err);
  process.exit(1);
});
