const { extractDomain } = require('../utils/domain.util');

const validateDomain = (req, res, next) => {
    try {
        const accessKey = req.verifiedAccessKeys;

        if (!accessKey) {
            return res.status(401).json({
                success: false,
                message: 'Access key not verified',
            });
        }

        // Debug: Log all headers
        console.log('Request headers:', req.headers);

        // Extract the domain from request origin or referer header
        const requestDomainOrigin = extractDomain(req);
        console.log('Extracted domain origin:', requestDomainOrigin);
        let requestDomain = null;

        if (requestDomainOrigin) {
            try {
                requestDomain = new URL(requestDomainOrigin).hostname;
            } catch {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid domain format in request',
                });
            }
        }

        // Get allowed domains from access key
        const allowedDomainNames = (accessKey.domains && accessKey.domains.length > 0)
            ? accessKey.domains.map(d => {
                // Extract hostname from domain name (handles both 'example.com' and 'http://example.com')
                try {
                    return new URL(d.access_key_domain_name).hostname || d.access_key_domain_name;
                } catch {
                    return d.access_key_domain_name;
                }
            })
            : [];

        // If access key has domain restrictions, validate the request domain
        if (allowedDomainNames.length > 0) {
            if (!requestDomain) {
                return res.status(403).json({
                    success: false,
                    message: 'Domain validation failed: No domain found in request',
                });
            }

            if (!allowedDomainNames.includes(requestDomain)) {
                return res.status(403).json({
                    success: false,
                    message: 'Domain not allowed for this access key',
                    requested_domain: requestDomain,
                    allowed_domains: allowedDomainNames,
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error in domain validation middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate domain',
        });
    }
};

module.exports = validateDomain;
