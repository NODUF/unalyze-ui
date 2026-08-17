/** @type {import('next').NextConfig} */
export default {
  // No transpilePackages, and that is the point: the published package must work as published.
  // Reaching for transpilePackages here would hide exactly the build failures this fixture exists
  // to surface, and the consuming team would hit them instead.
}
