import { usersRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { AuthenticateUserUseCase } from "../../../application/usecases/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../application/usecases/CreateUserUseCase";
import { DeleteUserUseCase } from "../../../application/usecases/DeleteUserUseCase";
import { GetAllUsersUseCase } from "../../../application/usecases/GetAllUsersUseCase";
import { UpdateUserUseCase } from "../../../application/usecases/UpdateUserUseCase";

export class UsersController {
  /**
   * @swagger
   * /users/login:
   *   post:
   *     summary: User login with JWT cookie
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: User's username
   *               password:
   *                 type: string
   *                 description: User's password
   *     responses:
   *       200:
   *         description: Login successful, JWT set in HttpOnly cookie
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *         headers:
   *           Set-Cookie:
   *             description: JWT token in HttpOnly cookie
   *             schema:
   *               type: string
   *               example: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; Secure; SameSite=Lax
   *       401:
   *         description: Invalid credentials
   *       400:
   *         description: Missing required fields
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;

    const useCase = new AuthenticateUserUseCase(usersRepo);
    const authenticadedUser = await useCase.execute(username, password);

    if (!authenticadedUser)
      return next(new ApiError(401, messages.errors.server.credentials));

    const { token, user } = authenticadedUser;
    if (!token)
      return next(new ApiError(401, messages.errors.server.credentials));

    // Set JWT in HttpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true, // Protects from XSS
      path: "/",
      secure: req.protocol === "https",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(user);
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       500:
   *         description: Internal server error
   */
  static async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetAllUsersUseCase(usersRepo);
      const users = await useCase.execute();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/authenticate:
   *   post:
   *     summary: Authenticate user (without setting cookie)
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: User's username
   *               password:
   *                 type: string
   *                 description: User's password
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: JWT token
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Missing username or password
   *       401:
   *         description: Invalid credentials
   */
  static async authenticate(req: Request, res: Response, next: NextFunction) {
    const { username, password } = req.body;

    if (!username || !password)
      return next(new ApiError(400, messages.errors.validation.invalidData));

    try {
      const useCase = new AuthenticateUserUseCase(usersRepo);
      const user = await useCase.execute(username, password);

      if (!user)
        return next(new ApiError(401, messages.errors.server.credentials));

      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Unique username
   *               password:
   *                 type: string
   *                 description: User's password
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User's email (optional)
   *               role:
   *                 type: string
   *                 enum: [user, admin]
   *                 description: User role (optional)
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid data or username already exists
   *       500:
   *         description: Internal server error
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new CreateUserUseCase(usersRepo);
      const user = await useCase.execute(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: New username
   *               password:
   *                 type: string
   *                 description: New password
   *               email:
   *                 type: string
   *                 format: email
   *                 description: New email
   *               role:
   *                 type: string
   *                 enum: [user, admin]
   *                 description: New role
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: User updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid ID or data
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateUserUseCase(usersRepo);
      const result = await useCase.execute(id, req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: User deleted successfully
   *                 data:
   *                   type: object
   *                   description: Deletion result
   *       400:
   *         description: Invalid ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteUserUseCase(usersRepo);
      const result = await useCase.execute(id);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
