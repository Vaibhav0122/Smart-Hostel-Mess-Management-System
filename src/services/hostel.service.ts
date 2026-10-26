import mongoose from "mongoose";
import { Hostel, IHostel } from "../models/Hostel";
import { Building, IBuilding } from "../models/Building";
import { Room, IRoom, ROOM_CAPACITY_MAP, RoomType } from "../models/Room";
import { Bed, IBed, BedStatus } from "../models/Bed";
import { BedAllocation, IBedAllocation } from "../models/BedAllocation";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { AuthenticatedUser } from "../types/express";
import {
  CreateHostelInput,
  UpdateHostelInput,
  CreateBuildingInput,
  UpdateBuildingInput,
  CreateRoomInput,
  UpdateRoomInput,
  AllocateBedInput,
  TransferBedInput,
  CheckoutBedInput,
} from "../validations/hostel.validation";

export class HostelService {
  // =========================================================================
  // HOSTEL CRUD
  // =========================================================================

  public static async createHostel(
    adminUser: AuthenticatedUser,
    input: CreateHostelInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IHostel> {
    const existingCode = await Hostel.findOne({ code: input.code.toUpperCase() });
    if (existingCode) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "HOSTEL_CODE_EXISTS",
        `A hostel with code '${input.code}' already exists.`
      );
    }

    const existingName = await Hostel.findOne({ name: input.name.trim() });
    if (existingName) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "HOSTEL_NAME_EXISTS",
        `A hostel with name '${input.name}' already exists.`
      );
    }

    const hostel = await Hostel.create({
      name: input.name.trim(),
      code: input.code.toUpperCase().trim(),
      genderType: input.genderType,
      wardenInChargeId: input.wardenInChargeId || null,
      contactPhone: input.contactPhone || null,
      contactEmail: input.contactEmail || null,
      address: input.address || {},
      amenities: input.amenities || [],
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CREATE_HOSTEL",
        targetCollection: "hostels",
        targetDocumentId: hostel._id,
        newState: hostel.toObject(),
        reason: `Admin ${adminUser.email} created hostel ${hostel.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return hostel;
  }

  public static async listHostels(query: {
    genderType?: string;
    isActive?: string | boolean;
  }): Promise<IHostel[]> {
    const filter: Record<string, unknown> = {};
    if (query.genderType) filter.genderType = query.genderType;
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true" || query.isActive === true;
    }
    return Hostel.find(filter).sort({ name: 1 });
  }

  public static async getHostelById(hostelId: string): Promise<IHostel> {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }
    return hostel;
  }

  public static async updateHostel(
    adminUser: AuthenticatedUser,
    hostelId: string,
    input: UpdateHostelInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IHostel> {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    if (input.code && input.code !== hostel.code) {
      const codeConflict = await Hostel.findOne({
        code: input.code.toUpperCase(),
        _id: { $ne: hostelId },
      });
      if (codeConflict) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "HOSTEL_CODE_EXISTS",
          `A hostel with code '${input.code}' already exists.`
        );
      }
    }

    if (input.name && input.name !== hostel.name) {
      const nameConflict = await Hostel.findOne({
        name: input.name.trim(),
        _id: { $ne: hostelId },
      });
      if (nameConflict) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "HOSTEL_NAME_EXISTS",
          `A hostel with name '${input.name}' already exists.`
        );
      }
    }

    const previousState = hostel.toObject();
    Object.assign(hostel, input);
    await hostel.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "UPDATE_HOSTEL",
        targetCollection: "hostels",
        targetDocumentId: hostel._id,
        previousState,
        newState: hostel.toObject(),
        reason: `Admin ${adminUser.email} updated hostel ${hostel.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return hostel;
  }

  public static async deleteHostel(
    adminUser: AuthenticatedUser,
    hostelId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    // Check if building or room references exist
    const hasBuildings = await Building.findOne({ hostelId });
    if (hasBuildings) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "HOSTEL_IN_USE",
        "Cannot delete hostel that contains active buildings. Decommission or remove buildings first."
      );
    }

    await Hostel.findByIdAndDelete(hostelId);

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "DELETE_HOSTEL",
        targetCollection: "hostels",
        targetDocumentId: hostel._id,
        previousState: hostel.toObject(),
        reason: `Admin ${adminUser.email} deleted hostel ${hostel.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }
  }

  // =========================================================================
  // BUILDING CRUD
  // =========================================================================

  public static async createBuilding(
    adminUser: AuthenticatedUser,
    input: CreateBuildingInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IBuilding> {
    const hostel = await Hostel.findById(input.hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    const existing = await Building.findOne({
      hostelId: input.hostelId,
      name: input.name.trim(),
    });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BUILDING_NAME_EXISTS",
        `A building named '${input.name}' already exists in this hostel.`
      );
    }

    const building = await Building.create({
      hostelId: input.hostelId,
      name: input.name.trim(),
      totalFloors: input.totalFloors,
      status: input.status || "ACTIVE",
    });

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CREATE_BUILDING",
        targetCollection: "buildings",
        targetDocumentId: building._id,
        newState: building.toObject(),
        reason: `Admin ${adminUser.email} created building ${building.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return building;
  }

  public static async listBuildings(hostelId?: string): Promise<IBuilding[]> {
    const filter = hostelId ? { hostelId } : {};
    return Building.find(filter).sort({ name: 1 });
  }

  public static async getBuildingById(buildingId: string): Promise<IBuilding> {
    const building = await Building.findById(buildingId);
    if (!building) {
      throw new AppError(HttpStatus.NOT_FOUND, "BUILDING_NOT_FOUND", "Building not found.");
    }
    return building;
  }

  public static async updateBuilding(
    adminUser: AuthenticatedUser,
    buildingId: string,
    input: UpdateBuildingInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IBuilding> {
    const building = await Building.findById(buildingId);
    if (!building) {
      throw new AppError(HttpStatus.NOT_FOUND, "BUILDING_NOT_FOUND", "Building not found.");
    }

    if (input.name && input.name !== building.name) {
      const conflict = await Building.findOne({
        hostelId: building.hostelId,
        name: input.name.trim(),
        _id: { $ne: buildingId },
      });
      if (conflict) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "BUILDING_NAME_EXISTS",
          `A building named '${input.name}' already exists in this hostel.`
        );
      }
    }

    const previousState = building.toObject();
    Object.assign(building, input);
    await building.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "UPDATE_BUILDING",
        targetCollection: "buildings",
        targetDocumentId: building._id,
        previousState,
        newState: building.toObject(),
        reason: `Admin ${adminUser.email} updated building ${building.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return building;
  }

  public static async deleteBuilding(
    adminUser: AuthenticatedUser,
    buildingId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const building = await Building.findById(buildingId);
    if (!building) {
      throw new AppError(HttpStatus.NOT_FOUND, "BUILDING_NOT_FOUND", "Building not found.");
    }

    const hasRooms = await Room.findOne({ buildingId });
    if (hasRooms) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BUILDING_IN_USE",
        "Cannot delete building containing rooms. Remove or transfer rooms first."
      );
    }

    await Building.findByIdAndDelete(buildingId);

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "DELETE_BUILDING",
        targetCollection: "buildings",
        targetDocumentId: building._id,
        previousState: building.toObject(),
        reason: `Admin ${adminUser.email} deleted building ${building.name}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }
  }

  // =========================================================================
  // ROOM & BED CRUD
  // =========================================================================

  public static async createRoom(
    adminUser: AuthenticatedUser,
    input: CreateRoomInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ room: IRoom; beds: IBed[] }> {
    const hostel = await Hostel.findById(input.hostelId);
    if (!hostel) {
      throw new AppError(HttpStatus.NOT_FOUND, "HOSTEL_NOT_FOUND", "Hostel not found.");
    }

    const building = await Building.findById(input.buildingId);
    if (!building) {
      throw new AppError(HttpStatus.NOT_FOUND, "BUILDING_NOT_FOUND", "Building not found.");
    }

    const existingRoom = await Room.findOne({
      hostelId: input.hostelId,
      buildingId: input.buildingId,
      roomNumber: input.roomNumber.trim(),
    });
    if (existingRoom) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "ROOM_NUMBER_EXISTS",
        `Room '${input.roomNumber}' already exists in this building.`
      );
    }

    const capacity = ROOM_CAPACITY_MAP[input.roomType as RoomType];

    const room = await Room.create({
      hostelId: input.hostelId,
      buildingId: input.buildingId,
      roomNumber: input.roomNumber.trim(),
      floor: input.floor,
      roomType: input.roomType,
      capacity,
      occupiedBeds: 0,
      baseMonthlyRent: input.baseMonthlyRent,
      status: input.status || "AVAILABLE",
      maintenanceReason: input.maintenanceReason || null,
    });

    // Auto-provision beds according to capacity (Bed A, Bed B, etc.)
    const createdBeds: IBed[] = [];
    for (let i = 0; i < capacity; i++) {
      const bedLabel = String.fromCharCode(65 + i); // 'A', 'B', 'C', 'D'
      const bed = await Bed.create({
        roomId: room._id,
        buildingId: room.buildingId,
        hostelId: room.hostelId,
        bedLabel,
        status: "VACANT",
        currentAllocationId: null,
      });
      createdBeds.push(bed);
    }

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CREATE_ROOM",
        targetCollection: "rooms",
        targetDocumentId: room._id,
        newState: {
          room: room.toObject(),
          bedsCount: createdBeds.length,
        },
        reason: `Admin ${adminUser.email} created room ${room.roomNumber} with ${capacity} beds`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return { room, beds: createdBeds };
  }

  public static async listRooms(query: {
    hostelId?: string;
    buildingId?: string;
    floor?: number | string;
    status?: string;
    roomType?: string;
    availableOnly?: string | boolean;
  }): Promise<Array<Record<string, unknown>>> {
    const filter: Record<string, unknown> = {};
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.buildingId) filter.buildingId = query.buildingId;
    if (query.floor !== undefined) filter.floor = Number(query.floor);
    if (query.status) filter.status = query.status;
    if (query.roomType) filter.roomType = query.roomType;
    if (query.availableOnly === "true" || query.availableOnly === true) {
      filter.status = "AVAILABLE";
    }

    const rooms = await Room.find(filter).sort({ floor: 1, roomNumber: 1 });
    return rooms.map((room) => {
      const obj = room.toObject ? room.toObject() : room;
      return {
        ...obj,
        vacancy: Math.max(0, room.capacity - room.occupiedBeds),
      };
    });
  }

  public static async getRoomById(
    roomId: string
  ): Promise<{ room: IRoom; beds: IBed[]; vacancy: number }> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new AppError(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found.");
    }
    const beds = await Bed.find({ roomId }).sort({ bedLabel: 1 });
    return {
      room,
      beds,
      vacancy: Math.max(0, room.capacity - room.occupiedBeds),
    };
  }

  public static async updateRoom(
    adminUser: AuthenticatedUser,
    roomId: string,
    input: UpdateRoomInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IRoom> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new AppError(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found.");
    }

    if (input.roomNumber && input.roomNumber !== room.roomNumber) {
      const conflict = await Room.findOne({
        hostelId: room.hostelId,
        buildingId: room.buildingId,
        roomNumber: input.roomNumber.trim(),
        _id: { $ne: roomId },
      });
      if (conflict) {
        throw new AppError(
          HttpStatus.CONFLICT,
          "ROOM_NUMBER_EXISTS",
          `Room '${input.roomNumber}' already exists in this building.`
        );
      }
    }

    const previousState = room.toObject();
    Object.assign(room, input);
    await room.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "UPDATE_ROOM",
        targetCollection: "rooms",
        targetDocumentId: room._id,
        previousState,
        newState: room.toObject(),
        reason: `Admin ${adminUser.email} updated room ${room.roomNumber}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return room;
  }

  public static async deleteRoom(
    adminUser: AuthenticatedUser,
    roomId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new AppError(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found.");
    }

    if (room.occupiedBeds > 0) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "ROOM_OCCUPIED",
        "Cannot delete room with active residents. Reallocate or checkout residents first."
      );
    }

    await Bed.deleteMany({ roomId });
    await Room.findByIdAndDelete(roomId);

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "DELETE_ROOM",
        targetCollection: "rooms",
        targetDocumentId: room._id,
        previousState: room.toObject(),
        reason: `Admin ${adminUser.email} deleted room ${room.roomNumber}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }
  }

  // =========================================================================
  // BED LIST & STATUS
  // =========================================================================

  public static async listBeds(query: {
    roomId?: string;
    hostelId?: string;
    status?: BedStatus;
  }): Promise<IBed[]> {
    const filter: Record<string, unknown> = {};
    if (query.roomId) filter.roomId = query.roomId;
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.status) filter.status = query.status;
    return Bed.find(filter).sort({ bedLabel: 1 });
  }

  public static async getBedById(bedId: string): Promise<IBed> {
    const bed = await Bed.findById(bedId);
    if (!bed) {
      throw new AppError(HttpStatus.NOT_FOUND, "BED_NOT_FOUND", "Bed not found.");
    }
    return bed;
  }

  public static async updateBedStatus(
    adminUser: AuthenticatedUser,
    bedId: string,
    newStatus: BedStatus,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IBed> {
    const bed = await Bed.findById(bedId);
    if (!bed) {
      throw new AppError(HttpStatus.NOT_FOUND, "BED_NOT_FOUND", "Bed not found.");
    }

    if (bed.status === "OCCUPIED" && newStatus !== "OCCUPIED") {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BED_CURRENTLY_OCCUPIED",
        "Cannot manually change status of an occupied bed. Use checkout or transfer APIs instead."
      );
    }

    const previousState = bed.toObject();
    bed.status = newStatus;
    await bed.save();

    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "UPDATE_BED_STATUS",
        targetCollection: "beds",
        targetDocumentId: bed._id,
        previousState,
        newState: bed.toObject(),
        reason: `Admin ${adminUser.email} changed bed status to ${newStatus}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return bed;
  }

  // =========================================================================
  // BED ALLOCATION, TRANSFER, AND CHECKOUT
  // =========================================================================

  /**
   * Allocates a vacant bed to a student.
   * Multi-tier defense against double-allocation and overcapacity:
   *  Tier 1: Application-level validations (student active, bed vacant, room not full)
   *  Tier 2: Atomic conditional mutation
   *  Tier 3: Partial unique index on BedAllocation { studentId: 1, status: 'ACTIVE' }
   */
  public static async allocateBed(
    adminUser: AuthenticatedUser,
    input: AllocateBedInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ allocation: IBedAllocation; bed: IBed; room: IRoom }> {
    // 1. Validate student exists
    const student = await User.findById(input.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "STUDENT_NOT_FOUND",
        "Target student was not found or is not a student account."
      );
    }

    // 2. Prevent duplicate active allocations for the same student
    const activeStudentAllocation = await BedAllocation.findOne({
      studentId: input.studentId,
      status: "ACTIVE",
    });
    if (activeStudentAllocation) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "STUDENT_ALREADY_ALLOCATED",
        "Student already has an active bed allocation. Transfer or checkout before allocating a new bed."
      );
    }

    // 3. Validate target bed exists and is VACANT
    const bed = await Bed.findById(input.bedId);
    if (!bed) {
      throw new AppError(HttpStatus.NOT_FOUND, "BED_NOT_FOUND", "Selected bed not found.");
    }
    if (bed.status !== "VACANT") {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BED_NOT_AVAILABLE",
        `Selected bed '${bed.bedLabel}' is currently ${bed.status} and cannot be allocated.`
      );
    }

    // 4. Validate target room exists and has available capacity
    const room = await Room.findById(bed.roomId);
    if (!room) {
      throw new AppError(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Room not found.");
    }
    if (room.occupiedBeds >= room.capacity) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "ROOM_CAPACITY_EXCEEDED",
        `Room ${room.roomNumber} has reached its maximum capacity of ${room.capacity}.`
      );
    }

    // 5. Atomic conditional update on bed status (prevents race condition)
    const updatedBed = await Bed.findOneAndUpdate(
      { _id: bed._id, status: "VACANT" },
      { status: "OCCUPIED" },
      { new: true }
    );
    if (!updatedBed) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BED_NOT_AVAILABLE",
        "Bed was occupied by a concurrent request. Please select another bed."
      );
    }

    // 6. Increment room occupied count
    const updatedRoom = await Room.findByIdAndUpdate(
      room._id,
      {
        $inc: { occupiedBeds: 1 },
      },
      { new: true }
    );

    if (updatedRoom && updatedRoom.occupiedBeds >= updatedRoom.capacity) {
      await Room.findByIdAndUpdate(room._id, { status: "FULL" });
      updatedRoom.status = "FULL";
    }

    // 7. Create BedAllocation record
    const allocation = await BedAllocation.create({
      studentId: student._id,
      hostelId: room.hostelId,
      buildingId: room.buildingId,
      roomId: room._id,
      bedId: updatedBed._id,
      startDate: input.startDate || new Date(),
      status: "ACTIVE",
      allocatedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
      remarks: input.remarks || null,
    });

    // Update bed with currentAllocationId
    updatedBed.currentAllocationId = allocation._id as mongoose.Types.ObjectId;
    await updatedBed.save();

    // 8. Audit Log
    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "ALLOCATE_BED",
        targetCollection: "bedAllocations",
        targetDocumentId: allocation._id,
        newState: {
          allocation: allocation.toObject(),
          bedId: updatedBed._id,
          roomId: room._id,
          studentId: student._id,
        },
        reason: `Admin ${adminUser.email} allocated bed ${updatedBed.bedLabel} in room ${room.roomNumber} to student ${student.email}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return {
      allocation,
      bed: updatedBed,
      room: updatedRoom || room,
    };
  }

  /**
   * Transfers a student from their current bed to a new bed.
   * Atomically vacates previous bed and occupies target bed.
   */
  public static async transferBed(
    adminUser: AuthenticatedUser,
    input: TransferBedInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ newAllocation: IBedAllocation; oldAllocation: IBedAllocation }> {
    // 1. Locate existing active allocation
    const currentAllocation = await BedAllocation.findById(input.currentAllocationId);
    if (!currentAllocation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "ALLOCATION_NOT_FOUND",
        "Active allocation record not found."
      );
    }
    if (currentAllocation.status !== "ACTIVE") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "ALLOCATION_NOT_ACTIVE",
        "Can only transfer allocations that are currently in ACTIVE status."
      );
    }

    // 2. Validate target bed
    const targetBed = await Bed.findById(input.targetBedId);
    if (!targetBed) {
      throw new AppError(HttpStatus.NOT_FOUND, "BED_NOT_FOUND", "Target bed not found.");
    }
    if (targetBed._id.toString() === currentAllocation.bedId.toString()) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "SAME_BED_TRANSFER",
        "Target bed cannot be the same as the student's currently allocated bed."
      );
    }
    if (targetBed.status !== "VACANT") {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BED_NOT_AVAILABLE",
        `Target bed '${targetBed.bedLabel}' is currently ${targetBed.status} and cannot receive transfers.`
      );
    }

    // 3. Validate target room
    const targetRoom = await Room.findById(targetBed.roomId);
    if (!targetRoom) {
      throw new AppError(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "Target room not found.");
    }

    const isSameRoom =
      currentAllocation.roomId.toString() === targetRoom._id.toString();

    if (!isSameRoom && targetRoom.occupiedBeds >= targetRoom.capacity) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "ROOM_CAPACITY_EXCEEDED",
        `Target room ${targetRoom.roomNumber} is at maximum capacity (${targetRoom.capacity}).`
      );
    }

    // 4. Atomically claim target bed
    const claimedBed = await Bed.findOneAndUpdate(
      { _id: targetBed._id, status: "VACANT" },
      { status: "OCCUPIED" },
      { new: true }
    );
    if (!claimedBed) {
      throw new AppError(
        HttpStatus.CONFLICT,
        "BED_NOT_AVAILABLE",
        "Target bed was claimed concurrently. Please select another bed."
      );
    }

    // 5. Vacate previous bed
    await Bed.findByIdAndUpdate(currentAllocation.bedId, {
      status: "VACANT",
      currentAllocationId: null,
    });

    // 6. Update room occupancies
    if (!isSameRoom) {
      // Decrement old room
      const oldRoom = await Room.findByIdAndUpdate(
        currentAllocation.roomId,
        { $inc: { occupiedBeds: -1 } },
        { new: true }
      );
      if (oldRoom && oldRoom.status === "FULL") {
        await Room.findByIdAndUpdate(oldRoom._id, { status: "AVAILABLE" });
      }

      // Increment target room
      const newRoom = await Room.findByIdAndUpdate(
        targetRoom._id,
        { $inc: { occupiedBeds: 1 } },
        { new: true }
      );
      if (newRoom && newRoom.occupiedBeds >= newRoom.capacity) {
        await Room.findByIdAndUpdate(newRoom._id, { status: "FULL" });
      }
    }

    // 7. Transition previous allocation to TRANSFERRED
    currentAllocation.status = "TRANSFERRED";
    currentAllocation.endDate = new Date();
    currentAllocation.remarks = input.transferReason || "Transferred to new room/bed";
    await currentAllocation.save();

    // 8. Create new active BedAllocation record
    const newAllocation = await BedAllocation.create({
      studentId: currentAllocation.studentId,
      hostelId: targetRoom.hostelId,
      buildingId: targetRoom.buildingId,
      roomId: targetRoom._id,
      bedId: claimedBed._id,
      startDate: new Date(),
      status: "ACTIVE",
      allocatedByAdminId: new mongoose.Types.ObjectId(adminUser.id),
      remarks: input.transferReason || `Transferred from room allocation ${currentAllocation._id}`,
    });

    claimedBed.currentAllocationId = newAllocation._id as mongoose.Types.ObjectId;
    await claimedBed.save();

    // 9. Audit Log
    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "TRANSFER_BED",
        targetCollection: "bedAllocations",
        targetDocumentId: newAllocation._id,
        newState: {
          previousAllocationId: currentAllocation._id,
          newAllocationId: newAllocation._id,
          targetBedId: claimedBed._id,
          targetRoomId: targetRoom._id,
        },
        reason: `Admin ${adminUser.email} transferred student ${currentAllocation.studentId} to room ${targetRoom.roomNumber}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return {
      newAllocation,
      oldAllocation: currentAllocation,
    };
  }

  /**
   * Checks out a student from their bed allocation.
   * Marks allocation CHECKED_OUT, vacates bed, and decrements room occupied count.
   */
  public static async checkoutBed(
    adminUser: AuthenticatedUser,
    input: CheckoutBedInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IBedAllocation> {
    const allocation = await BedAllocation.findById(input.allocationId);
    if (!allocation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "ALLOCATION_NOT_FOUND",
        "Bed allocation not found."
      );
    }
    if (allocation.status !== "ACTIVE") {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "ALLOCATION_NOT_ACTIVE",
        "Can only checkout an allocation that is currently in ACTIVE status."
      );
    }

    // 1. Vacate bed
    await Bed.findByIdAndUpdate(allocation.bedId, {
      status: "VACANT",
      currentAllocationId: null,
    });

    // 2. Decrement room occupied beds
    const room = await Room.findByIdAndUpdate(
      allocation.roomId,
      { $inc: { occupiedBeds: -1 } },
      { new: true }
    );
    if (room && room.status === "FULL") {
      await Room.findByIdAndUpdate(room._id, { status: "AVAILABLE" });
    }

    // 3. Complete allocation record
    allocation.status = "CHECKED_OUT";
    allocation.endDate = new Date();
    if (input.remarks) allocation.remarks = input.remarks;
    await allocation.save();

    // 4. Audit Log
    try {
      await AuditLog.create({
        actorId: adminUser.id,
        actorRole: adminUser.role,
        action: "CHECKOUT_BED",
        targetCollection: "bedAllocations",
        targetDocumentId: allocation._id,
        newState: allocation.toObject(),
        reason: `Admin ${adminUser.email} checked out student ${allocation.studentId}`,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      });
    } catch {
      // Non-fatal
    }

    return allocation;
  }

  public static async listAllocations(query: {
    studentId?: string;
    roomId?: string;
    bedId?: string;
    hostelId?: string;
    status?: string;
  }): Promise<IBedAllocation[]> {
    const filter: Record<string, unknown> = {};
    if (query.studentId) filter.studentId = query.studentId;
    if (query.roomId) filter.roomId = query.roomId;
    if (query.bedId) filter.bedId = query.bedId;
    if (query.hostelId) filter.hostelId = query.hostelId;
    if (query.status) filter.status = query.status;
    return BedAllocation.find(filter).sort({ createdAt: -1 });
  }

  public static async getStudentAllocationHistory(
    studentId: string
  ): Promise<IBedAllocation[]> {
    return BedAllocation.find({ studentId }).sort({ createdAt: -1 });
  }
}
