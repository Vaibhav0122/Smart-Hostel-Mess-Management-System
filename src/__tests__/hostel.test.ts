import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { Hostel } from "../models/Hostel";
import { Building } from "../models/Building";
import { Room } from "../models/Room";
import { Bed } from "../models/Bed";
import { BedAllocation } from "../models/BedAllocation";
import { UserRole, UserStatus } from "../constants/roles";
import { generateAccessToken } from "../utils/token";

jest.mock("../models/User");
jest.mock("../models/AuditLog");
jest.mock("../models/Hostel");
jest.mock("../models/Building");
jest.mock("../models/Room");
jest.mock("../models/Bed");
jest.mock("../models/BedAllocation");

const MockedUser = User as jest.Mocked<typeof User>;
const MockedAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;
const MockedHostel = Hostel as jest.Mocked<typeof Hostel>;
const MockedBuilding = Building as jest.Mocked<typeof Building>;
const MockedRoom = Room as jest.Mocked<typeof Room>;
const MockedBed = Bed as jest.Mocked<typeof Bed>;
const MockedBedAllocation = BedAllocation as jest.Mocked<typeof BedAllocation>;

describe("Phase 5: Hostel, Building, Room & Bed Management", () => {
  const adminUser: any = {
    _id: "660000000000000000000001",
    email: "warden@hostel.edu",
    role: UserRole.HOSTEL_ADMIN,
    status: UserStatus.ACTIVE,
  };

  const studentUser: any = {
    _id: "660000000000000000000002",
    email: "student1@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610001",
  };

  const studentUser2: any = {
    _id: "660000000000000000000003",
    email: "student2@hostel.edu",
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    studentId: "STU-202610002",
  };

  let adminToken: string;
  let studentToken: string;

  beforeAll(() => {
    adminToken = generateAccessToken({
      sub: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status,
    });

    studentToken = generateAccessToken({
      sub: studentUser._id,
      email: studentUser.email,
      role: studentUser.role,
      status: studentUser.status,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default User.findById mock handling both .select() and direct await
    (MockedUser.findById as jest.Mock).mockImplementation((id: string) => {
      const u =
        id === adminUser._id
          ? adminUser
          : id === studentUser._id
          ? studentUser
          : id === studentUser2._id
          ? studentUser2
          : null;
      return {
        select: jest.fn().mockResolvedValue(u),
        then: (resolve: (val: any) => void) => resolve(u),
      };
    });

    // Default AuditLog
    (MockedAuditLog.create as jest.Mock).mockResolvedValue({} as any);
  });

  // =========================================================================
  // 1. HOSTEL CRUD
  // =========================================================================
  describe("Hostel CRUD APIs (/api/v1/hostels)", () => {
    it("should allow admin to create a new hostel", async () => {
      (MockedHostel.findOne as jest.Mock).mockResolvedValue(null);
      const mockCreatedHostel: any = {
        _id: "hostel_123",
        name: "Boys Hostel Block Alpha",
        code: "BH-A",
        genderType: "MALE",
        amenities: ["WIFI"],
        isActive: true,
        toObject: () => mockCreatedHostel,
      };
      (MockedHostel.create as jest.Mock).mockResolvedValueOnce(mockCreatedHostel);

      const response = await request(app)
        .post("/api/v1/hostels")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Boys Hostel Block Alpha",
          code: "BH-A",
          genderType: "MALE",
          amenities: ["WIFI"],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hostel.code).toBe("BH-A");
      expect(MockedHostel.create).toHaveBeenCalled();
    });

    it("should reject creating hostel with duplicate code with 409", async () => {
      (MockedHostel.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "hostel_existing",
        code: "BH-A",
      });

      const response = await request(app)
        .post("/api/v1/hostels")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Another Hostel",
          code: "BH-A",
          genderType: "MALE",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("HOSTEL_CODE_EXISTS");
    });

    it("should list all hostels", async () => {
      const mockHostels = [{ name: "Hostel 1", code: "H1" }];
      (MockedHostel.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockHostels),
      } as any);

      const response = await request(app)
        .get("/api/v1/hostels")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hostels).toHaveLength(1);
    });

    it("should get hostel by ID", async () => {
      const mockHostel = { _id: "hostel_123", name: "Hostel 1" };
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce(mockHostel);

      const response = await request(app)
        .get("/api/v1/hostels/hostel_123")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hostel._id).toBe("hostel_123");
    });

    it("should update hostel details", async () => {
      const mockHostel: any = {
        _id: "hostel_123",
        name: "Old Name",
        code: "H1",
      };
      mockHostel.toObject = () => mockHostel;
      mockHostel.save = jest.fn().mockResolvedValue(mockHostel);
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce(mockHostel);

      const response = await request(app)
        .patch("/api/v1/hostels/hostel_123")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(mockHostel.save).toHaveBeenCalled();
    });

    it("should prevent deleting hostel with active buildings", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "hostel_123",
      });
      (MockedBuilding.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "bld_1",
      });

      const response = await request(app)
        .delete("/api/v1/hostels/hostel_123")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("HOSTEL_IN_USE");
    });
  });

  // =========================================================================
  // 2. BUILDING CRUD
  // =========================================================================
  describe("Building CRUD APIs (/api/v1/buildings)", () => {
    it("should allow admin to create a building in a hostel", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000010",
      });
      (MockedBuilding.findOne as jest.Mock).mockResolvedValueOnce(null);

      const mockBuilding: any = {
        _id: "bld_1",
        hostelId: "660000000000000000000010",
        name: "Wing A",
        totalFloors: 3,
        status: "ACTIVE",
        toObject: () => mockBuilding,
      };
      (MockedBuilding.create as jest.Mock).mockResolvedValueOnce(mockBuilding);

      const response = await request(app)
        .post("/api/v1/buildings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: "660000000000000000000010",
          name: "Wing A",
          totalFloors: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.building.name).toBe("Wing A");
    });

    it("should reject building creation with duplicate name in same hostel", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000010",
      });
      (MockedBuilding.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "bld_existing",
      });

      const response = await request(app)
        .post("/api/v1/buildings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: "660000000000000000000010",
          name: "Wing A",
          totalFloors: 3,
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("BUILDING_NAME_EXISTS");
    });
  });

  // =========================================================================
  // 3. ROOM & BED CRUD
  // =========================================================================
  describe("Room & Bed Management APIs (/api/v1/rooms, /api/v1/beds)", () => {
    it("should create room and auto-provision beds matching capacity", async () => {
      (MockedHostel.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000010",
      });
      (MockedBuilding.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000020",
      });
      (MockedRoom.findOne as jest.Mock).mockResolvedValueOnce(null);

      const mockRoom: any = {
        _id: "room_101",
        hostelId: "660000000000000000000010",
        buildingId: "660000000000000000000020",
        roomNumber: "101",
        floor: 1,
        roomType: "DOUBLE",
        capacity: 2,
        occupiedBeds: 0,
        baseMonthlyRent: 8000,
        status: "AVAILABLE",
        toObject: () => mockRoom,
      };
      (MockedRoom.create as jest.Mock).mockResolvedValueOnce(mockRoom);

      (MockedBed.create as jest.Mock)
        .mockResolvedValueOnce({ _id: "bed_1", bedLabel: "A", status: "VACANT" })
        .mockResolvedValueOnce({ _id: "bed_2", bedLabel: "B", status: "VACANT" });

      const response = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hostelId: "660000000000000000000010",
          buildingId: "660000000000000000000020",
          roomNumber: "101",
          floor: 1,
          roomType: "DOUBLE",
          baseMonthlyRent: 8000,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.room.capacity).toBe(2);
      expect(response.body.data.beds).toHaveLength(2);
      expect(MockedBed.create).toHaveBeenCalledTimes(2);
    });

    it("should list rooms with accurate vacancy counts", async () => {
      const mockRooms = [
        {
          _id: "room_1",
          roomNumber: "101",
          capacity: 2,
          occupiedBeds: 1,
          toObject: () => ({ _id: "room_1", roomNumber: "101", capacity: 2, occupiedBeds: 1 }),
        },
      ];
      (MockedRoom.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockRooms),
      } as any);

      const response = await request(app)
        .get("/api/v1/rooms")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.rooms[0].vacancy).toBe(1); // 2 - 1 = 1
    });

    it("should prevent deleting a room with active residents", async () => {
      (MockedRoom.findById as jest.Mock).mockResolvedValueOnce({
        _id: "room_101",
        occupiedBeds: 1, // Has resident
      });

      const response = await request(app)
        .delete("/api/v1/rooms/room_101")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ROOM_OCCUPIED");
    });

    it("should update bed status", async () => {
      const mockBed: any = {
        _id: "bed_1",
        status: "VACANT",
      };
      mockBed.toObject = () => mockBed;
      mockBed.save = jest.fn().mockResolvedValue(mockBed);
      (MockedBed.findById as jest.Mock).mockResolvedValueOnce(mockBed);

      const response = await request(app)
        .patch("/api/v1/beds/bed_1/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "UNDER_MAINTENANCE" });

      expect(response.status).toBe(200);
      expect(mockBed.status).toBe("UNDER_MAINTENANCE");
    });
  });

  // =========================================================================
  // 4. BED ALLOCATION, TRANSFER & CHECKOUT
  // =========================================================================
  describe("Bed Allocation & Lifecycle APIs (/api/v1/allocations)", () => {
    it("should successfully allocate a vacant bed to a student", async () => {
      // 1. student check
      (MockedBedAllocation.findOne as jest.Mock).mockResolvedValueOnce(null); // No active allocation

      // 2. target bed check
      const mockBed: any = {
        _id: "660000000000000000000040",
        roomId: "660000000000000000000030",
        bedLabel: "A",
        status: "VACANT",
        save: jest.fn().mockResolvedValue(true),
      };
      (MockedBed.findById as jest.Mock).mockResolvedValueOnce(mockBed);

      // 3. target room check
      const mockRoom: any = {
        _id: "660000000000000000000030",
        hostelId: "660000000000000000000010",
        buildingId: "660000000000000000000020",
        roomNumber: "101",
        capacity: 2,
        occupiedBeds: 0,
      };
      (MockedRoom.findById as jest.Mock).mockResolvedValueOnce(mockRoom);

      // 4. atomic bed update
      const updatedBed: any = {
        ...mockBed,
        status: "OCCUPIED",
        save: jest.fn().mockResolvedValue(true),
      };
      (MockedBed.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(updatedBed);

      // 5. increment room occupied
      (MockedRoom.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({
        ...mockRoom,
        occupiedBeds: 1,
      });

      // 6. create allocation
      const mockAllocation: any = {
        _id: "alloc_001",
        studentId: studentUser._id,
        bedId: updatedBed._id,
        roomId: mockRoom._id,
        status: "ACTIVE",
        toObject: () => mockAllocation,
      };
      (MockedBedAllocation.create as jest.Mock).mockResolvedValueOnce(mockAllocation);

      const response = await request(app)
        .post("/api/v1/allocations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id,
          bedId: "660000000000000000000040",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.allocation.status).toBe("ACTIVE");
      expect(MockedBed.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockBed._id, status: "VACANT" },
        { status: "OCCUPIED" },
        { new: true }
      );
    });

    it("should reject allocation if student already has an active allocation", async () => {
      (MockedBedAllocation.findOne as jest.Mock).mockResolvedValueOnce({
        _id: "existing_alloc",
        studentId: studentUser._id,
        status: "ACTIVE",
      });

      const response = await request(app)
        .post("/api/v1/allocations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id,
          bedId: "660000000000000000000040",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("STUDENT_ALREADY_ALLOCATED");
    });

    it("should reject allocation if bed is already occupied or maintenance", async () => {
      (MockedBedAllocation.findOne as jest.Mock).mockResolvedValueOnce(null);

      (MockedBed.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000040",
        bedLabel: "A",
        status: "OCCUPIED",
      });

      const response = await request(app)
        .post("/api/v1/allocations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id,
          bedId: "660000000000000000000040",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("BED_NOT_AVAILABLE");
    });

    it("should reject allocation if room capacity is exceeded", async () => {
      (MockedBedAllocation.findOne as jest.Mock).mockResolvedValueOnce(null);

      (MockedBed.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000040",
        roomId: "660000000000000000000030",
        bedLabel: "B",
        status: "VACANT",
      });

      (MockedRoom.findById as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000030",
        roomNumber: "101",
        capacity: 2,
        occupiedBeds: 2, // Full!
      });

      const response = await request(app)
        .post("/api/v1/allocations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id,
          bedId: "660000000000000000000040",
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("ROOM_CAPACITY_EXCEEDED");
    });

    it("should transfer student to a new bed and update room occupancies", async () => {
      const currentAlloc: any = {
        _id: "660000000000000000000088",
        studentId: studentUser._id,
        bedId: "660000000000000000000040", // old bed
        roomId: "660000000000000000000030", // old room
        status: "ACTIVE",
        save: jest.fn().mockResolvedValue(true),
      };
      (MockedBedAllocation.findById as jest.Mock).mockResolvedValueOnce(currentAlloc);

      const targetBed: any = {
        _id: "660000000000000000000050", // new bed
        roomId: "660000000000000000000035", // new room
        bedLabel: "A",
        status: "VACANT",
        save: jest.fn().mockResolvedValue(true),
      };
      (MockedBed.findById as jest.Mock).mockResolvedValueOnce(targetBed);

      const targetRoom: any = {
        _id: "660000000000000000000035",
        hostelId: "660000000000000000000010",
        buildingId: "660000000000000000000020",
        roomNumber: "102",
        capacity: 2,
        occupiedBeds: 0,
      };
      (MockedRoom.findById as jest.Mock).mockResolvedValueOnce(targetRoom);

      // Claim new bed
      (MockedBed.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({
        ...targetBed,
        status: "OCCUPIED",
        save: jest.fn().mockResolvedValue(true),
      });

      // Vacate old bed
      (MockedBed.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      // Decrement old room & increment new room
      (MockedRoom.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      // Create new allocation
      const newAlloc: any = {
        _id: "alloc_new_99",
        studentId: studentUser._id,
        bedId: targetBed._id,
        roomId: targetRoom._id,
        status: "ACTIVE",
      };
      (MockedBedAllocation.create as jest.Mock).mockResolvedValueOnce(newAlloc);

      const response = await request(app)
        .post("/api/v1/allocations/transfer")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          currentAllocationId: "660000000000000000000088",
          targetBedId: "660000000000000000000050",
          transferReason: "Relocating for medical requirements",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(currentAlloc.status).toBe("TRANSFERRED");
      expect(response.body.data.newAllocation._id).toBe("alloc_new_99");
    });

    it("should checkout student and release bed", async () => {
      const activeAlloc: any = {
        _id: "660000000000000000000088",
        studentId: studentUser._id,
        bedId: "660000000000000000000040",
        roomId: "660000000000000000000030",
        status: "ACTIVE",
        save: jest.fn().mockResolvedValue(true),
        toObject: () => activeAlloc,
      };
      (MockedBedAllocation.findById as jest.Mock).mockResolvedValueOnce(activeAlloc);
      (MockedBed.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(true);
      (MockedRoom.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({
        _id: "660000000000000000000030",
        occupiedBeds: 0,
        status: "AVAILABLE",
      });

      const response = await request(app)
        .post("/api/v1/allocations/checkout")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          allocationId: "660000000000000000000088",
          remarks: "Graduated semester",
        });

      expect(response.status).toBe(200);
      expect(activeAlloc.status).toBe("CHECKED_OUT");
      expect(MockedBed.findByIdAndUpdate).toHaveBeenCalledWith(
        activeAlloc.bedId,
        { status: "VACANT", currentAllocationId: null }
      );
    });
  });

  // =========================================================================
  // 5. RBAC & IDOR PERMISSION DEFENSES
  // =========================================================================
  describe("RBAC & IDOR Security Defenses", () => {
    it("should reject student attempting admin room creation with 403", async () => {
      const response = await request(app)
        .post("/api/v1/rooms")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          hostelId: "660000000000000000000010",
          buildingId: "660000000000000000000020",
          roomNumber: "999",
          floor: 1,
          roomType: "SINGLE",
          baseMonthlyRent: 5000,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_PERMISSION");
    });

    it("should reject unauthenticated request to allocate bed with 401", async () => {
      const response = await request(app)
        .post("/api/v1/allocations")
        .send({
          studentId: studentUser._id,
          bedId: "660000000000000000000040",
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("MISSING_AUTHENTICATION");
    });

    it("should allow student to view their own allocation history", async () => {
      const mockHistory = [{ _id: "alloc_1", studentId: studentUser._id }];
      (MockedBedAllocation.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockHistory),
      } as any);

      const response = await request(app)
        .get(`/api/v1/allocations/student/${studentUser._id}/history`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.history).toHaveLength(1);
    });

    it("should reject student attempting to view another student's allocation history with 403", async () => {
      const response = await request(app)
        .get(`/api/v1/allocations/student/${studentUser2._id}/history`)
        .set("Authorization", `Bearer ${studentToken}`); // student 1 accessing student 2

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe("FORBIDDEN_CROSS_STUDENT_ACCESS");
    });
  });
});
