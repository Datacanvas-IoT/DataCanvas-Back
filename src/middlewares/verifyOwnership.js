const Project = require("../models/projectModel");
const AccessKey = require("../models/accessKeyModel");

const ID_SOURCE_LABELS = {
  params: "parameter",
  query: "query parameter",
  body: "field",
};

const VALID_SOURCES = new Set(["params", "query", "body"]);

class OwnershipError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// resource-specific handlers
const RESOURCE_HANDLERS = {
  project: {
    idField: "project_id",
    async verify(parsedId, userId, req) {
      const project = await Project.findOne({
        where: { project_id: parsedId },
        attributes: ["project_id", "user_id"],
        raw: false,
      });

      if (!project) {
        throw new OwnershipError(404, "Project not found");
      }

      if (project.user_id !== userId) {
        throw new OwnershipError(403, "Forbidden: You do not own this project");
      }

      req.project = project;
      req.parsedProjectId = parsedId;
    },
  },

  accessKey: {
    idField: "access_key_id",
    async verify(parsedId, userId, req) {
      const accessKey = await AccessKey.findOne({
        where: { access_key_id: parsedId },
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["project_id", "user_id"],
            where: { user_id: userId },
            required: false,
          },
        ],
      });

      if (!accessKey) {
        throw new OwnershipError(404, "Access key not found");
      }

      if (!accessKey.project) {
        throw new OwnershipError(
          403,
          "Forbidden: You do not own this access key"
        );
      }

      req.accessKey = accessKey;
      req.project = accessKey.project;
      req.parsedAccessKeyId = parsedId;
    },
  },
};

/**
 * Middleware factory to verify resource ownership
 * @param {string} resourceType - Type of resource: 'project' or 'accessKey'
 * @param {string} idSource - Where to get the ID from: 'params', 'query', or 'body'
 * @returns {Function} Express middleware function
 */
const verifyOwnership = (resourceType, idSource = "params") => {
  const handler = RESOURCE_HANDLERS[resourceType];

  // Fail-fast validation at middleware creation time
  if (!handler) {
    throw new Error(
      `Invalid resourceType: ${resourceType}. Must be one of: ${Object.keys(
        RESOURCE_HANDLERS
      ).join(", ")}`
    );
  }
  if (!VALID_SOURCES.has(idSource)) {
    throw new Error(
      `Invalid idSource: ${idSource}. Must be one of: params, query, body`
    );
  }

  // Pre-compute configuration
  const actualIdField = handler.idField;
  const sourceLabel = ID_SOURCE_LABELS[idSource];

  return async (req, res, next) => {
    try {
      const userId = req.user.id || req.user.user_id;
      const resourceId = req[idSource]?.[actualIdField];

      // Validation
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Missing required ${sourceLabel}: ${actualIdField}`,
        });
      }

      const parsedId = Number(resourceId);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${actualIdField}: must be a positive integer`,
        });
      }

      // Delegate to resource-specific handler
      await handler.verify(parsedId, userId, req);
      next();
    } catch (error) {
      if (error instanceof OwnershipError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Error in ownership verification middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify resource ownership",
      });
    }
  };
};

module.exports = verifyOwnership;
