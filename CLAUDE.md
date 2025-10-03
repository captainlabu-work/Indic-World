# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Indic is a static website project focused on storytelling and creative content. The site consists of three HTML pages with inline CSS styling, emphasizing a minimalist indie aesthetic with serif typography.

## Architecture

### File Structure
- `Index.html` - Landing page with hero section and call-to-action buttons
- `about.html` - About page describing Indic's mission and philosophy  
- `contact.html` - Contact form integrated with Netlify Forms for backend processing
- `favicon.ico` - Site favicon
- `Indic 2.png` - Logo image used across all pages
- `Indic.png` - Alternative logo image

### Key Design Patterns
- **Inline CSS**: All styling is contained within `<style>` tags in each HTML file
- **Consistent Navigation**: Fixed navbar with logo and navigation links across all pages
- **Typography**: Uses Google Fonts 'Crimson Text' serif font throughout
- **Color Scheme**: Monochromatic palette (#262626, #fafafa, #e0e0e0, #8e8e8e)
- **Responsive Design**: Mobile-first approach with media queries for tablets and phones
- **Form Handling**: Contact form uses Netlify Forms with AJAX submission and fallback

## Development Guidelines

### Styling Conventions
- Maintain consistent spacing and color variables across pages
- Use CSS animations sparingly (fadeInUp for page elements)
- Preserve the indie/minimalist aesthetic when making changes
- Keep responsive breakpoints at 768px and 480px

### Form Integration
The contact form (`contact.html`) uses Netlify Forms:
- Form includes `data-netlify="true"` attribute
- Hidden honeypot field for spam prevention
- JavaScript handles AJAX submission with fallback to standard POST
- Success/error messages are displayed dynamically

### Navigation Structure
- Active page highlighting in navbar using `.active` class
- Logo links back to Index.html from all pages
- Consistent hover states for navigation links