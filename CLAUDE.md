
# General rules
- For UI styling use chakra: https://chakra-ui.com always. If there is no component for use case make sure user knows that and accepts creating custom component

# UI components and pages
- use only chakra components and styling. If there is no component for use case make sure user knows that and accepts creating custom component
- keep in mind there is dark mode and light mode, make sure to use chakra's color mode features to support both modes
- for pages use chakra's layout components like Box, Flex, Stack, etc to create responsive layouts
- keep components close to pages in project hierarchy structure, shared comopnents to src/app/_components

# API 
- when creating new api endpoint keep in mind that there are user roles and every endpiont should be protected unless it is public. Make sure to check user role and permissions before allowing access to endpoint

