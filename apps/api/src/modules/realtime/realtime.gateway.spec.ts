import type { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";

const friendshipFindMany = jest.fn();

jest.mock("@social/database", () => ({
  FriendshipStatus: { ACCEPTED: "ACCEPTED" },
  prisma: { friendship: { findMany: (...args: unknown[]) => friendshipFindMany(...args) } },
}));

// eslint-disable-next-line import/first -- import must follow jest.mock so the database module is mocked first
import type { PresenceService } from "./presence.service";
// eslint-disable-next-line import/first -- grouped with the import above, after the mock
import { RealtimeGateway } from "./realtime.gateway";

type EmitTarget = { emit: jest.Mock };

const createServer = () => {
  const rooms = new Map<string, EmitTarget>();
  const sockets = new Map<string, { data: { userId?: string }; id: string }>();

  const server = {
    of: jest.fn(() => ({ sockets })),
    to: jest.fn((room: string) => {
      const target = rooms.get(room) ?? { emit: jest.fn() };
      rooms.set(room, target);

      return target;
    }),
  };

  return { rooms, server: server as unknown as Server, sockets };
};

const createClient = (overrides: { token?: unknown } = {}): Socket => {
  const data: { userId?: string } = {};

  return {
    data,
    disconnect: jest.fn(),
    emit: jest.fn(),
    handshake: { auth: { token: overrides.token } },
    id: "socket-1",
    join: jest.fn(async () => undefined),
  } as unknown as Socket;
};

describe("RealtimeGateway", () => {
  let presenceService: jest.Mocked<Pick<PresenceService, "addConnection" | "isOnline" | "refresh" | "removeConnection">>;
  let jwtService: jest.Mocked<Pick<JwtService, "verifyAsync">>;

  beforeEach(() => {
    jest.clearAllMocks();
    presenceService = {
      addConnection: jest.fn(),
      isOnline: jest.fn(),
      refresh: jest.fn(),
      removeConnection: jest.fn(),
    };
    jwtService = { verifyAsync: jest.fn() };
    friendshipFindMany.mockResolvedValue([]);
  });

  const buildGateway = (server: Server) => {
    const gateway = new RealtimeGateway(jwtService as unknown as JwtService, presenceService as unknown as PresenceService);
    (gateway as unknown as { server: Server }).server = server;

    return gateway;
  };

  describe("handleConnection", () => {
    it("authenticates, joins the user room, and announces an offline -> online transition", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: "jwt" });

      jwtService.verifyAsync.mockResolvedValue({ sub: "user-1", type: "access" });
      friendshipFindMany.mockResolvedValue([{ addresseeId: "friend-1", requesterId: "user-1" }]);
      presenceService.addConnection.mockResolvedValue(true);

      await gateway.handleConnection(client);

      expect((client.data as { userId?: string }).userId).toBe("user-1");
      expect(client.join).toHaveBeenCalledWith("user:user-1");
      expect(presenceService.addConnection).toHaveBeenCalledWith("user-1", "socket-1");
      expect(rooms.get("user:friend-1")?.emit).toHaveBeenCalledWith("presence", { online: true, userId: "user-1" });
    });

    it("does not broadcast when the user already had another socket", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: "jwt" });

      jwtService.verifyAsync.mockResolvedValue({ sub: "user-1", type: "access" });
      friendshipFindMany.mockResolvedValue([{ addresseeId: "friend-1", requesterId: "user-1" }]);
      presenceService.addConnection.mockResolvedValue(false);

      await gateway.handleConnection(client);

      expect(rooms.get("user:friend-1")?.emit).toBeUndefined();
    });

    it("replays online friends to the freshly connected client", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: "jwt" });

      jwtService.verifyAsync.mockResolvedValue({ sub: "user-1", type: "access" });
      friendshipFindMany.mockResolvedValue([
        { addresseeId: "friend-online", requesterId: "user-1" },
        { addresseeId: "user-1", requesterId: "friend-offline" },
      ]);
      presenceService.isOnline.mockImplementation(async (id: string) => id === "friend-online");
      presenceService.addConnection.mockResolvedValue(false);

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith("presence", { online: true, userId: "friend-online" });
      expect(client.emit).toHaveBeenCalledTimes(1);
    });

    it("disconnects when no token is provided", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: undefined });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("disconnects when the token fails verification", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: "bad" });

      jwtService.verifyAsync.mockRejectedValue(new Error("invalid"));

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(presenceService.addConnection).not.toHaveBeenCalled();
    });

    it("disconnects when the token is not an access token", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient({ token: "refresh-jwt" });

      jwtService.verifyAsync.mockResolvedValue({ sub: "user-1", type: "refresh" });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(presenceService.addConnection).not.toHaveBeenCalled();
    });
  });

  describe("handleDisconnect", () => {
    it("broadcasts offline when the last socket goes away", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient();
      (client.data as { userId?: string }).userId = "user-1";

      friendshipFindMany.mockResolvedValue([{ addresseeId: "friend-1", requesterId: "user-1" }]);
      presenceService.removeConnection.mockResolvedValue(true);

      await gateway.handleDisconnect(client);

      expect(presenceService.removeConnection).toHaveBeenCalledWith("user-1", "socket-1");
      expect(rooms.get("user:friend-1")?.emit).toHaveBeenCalledWith("presence", { online: false, userId: "user-1" });
    });

    it("does not broadcast when other sockets remain", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient();
      (client.data as { userId?: string }).userId = "user-1";

      presenceService.removeConnection.mockResolvedValue(false);

      await gateway.handleDisconnect(client);

      expect(rooms.size).toBe(0);
    });

    it("is a no-op for an unauthenticated socket", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const client = createClient();

      await gateway.handleDisconnect(client);

      expect(presenceService.removeConnection).not.toHaveBeenCalled();
    });
  });

  describe("presence sweep", () => {
    it("refreshes presence for every authenticated socket on this node", async () => {
      const { server, sockets } = createServer();
      const gateway = buildGateway(server);

      sockets.set("a", { data: { userId: "user-1" }, id: "socket-a" });
      sockets.set("b", { data: { userId: "user-2" }, id: "socket-b" });
      sockets.set("c", { data: {}, id: "socket-c" });

      await (gateway as unknown as { refreshLocalPresence: () => Promise<void> }).refreshLocalPresence();

      expect(presenceService.refresh).toHaveBeenCalledWith("user-1", "socket-a");
      expect(presenceService.refresh).toHaveBeenCalledWith("user-2", "socket-b");
      expect(presenceService.refresh).toHaveBeenCalledTimes(2);
    });
  });

  describe("lifecycle", () => {
    it("starts and clears the presence sweep interval", () => {
      const { server } = createServer();
      const gateway = buildGateway(server);
      const setSpy = jest.spyOn(global, "setInterval");
      const clearSpy = jest.spyOn(global, "clearInterval");

      gateway.onModuleInit();
      expect(setSpy).toHaveBeenCalled();

      gateway.onModuleDestroy();
      expect(clearSpy).toHaveBeenCalled();

      setSpy.mockRestore();
      clearSpy.mockRestore();
    });
  });
});
