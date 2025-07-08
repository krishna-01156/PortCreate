import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, ExternalHyperlink, BorderStyle, TabStopPosition, TabStopType } from 'docx';
import { saveAs } from 'file-saver';
import { Portfolio } from '../types';

export const generateATSResume = async (portfolio: Portfolio) => {
  // Helper function to create section headings with horizontal line (no gap)
  const createSectionHeading = (text: string) => {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: text.toUpperCase(),
            bold: true,
            size: 26, // 13pt = 26 half-points
            font: 'Calibri',
          }),
        ],
        spacing: {
          before: 240,
          after: 0, // No gap between heading and line
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '',
            size: 4,
          }),
        ],
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: {
          after: 180,
        },
      }),
    ];
  };

  // Helper function to create bullet points
  const createBulletPoint = (text: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `• ${text}`,
          size: 22, // 11pt = 22 half-points
          font: 'Calibri',
        }),
      ],
      spacing: {
        after: 100,
      },
      indent: {
        left: 360,
      },
    });
  };

  // Helper function to create job entries with right-aligned dates
  const createJobEntry = (company: string, title: string, rightText: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `${company} - ${title}`,
          bold: true,
          size: 22,
          font: 'Calibri',
        }),
        new TextRun({
          text: '\t',
          size: 22,
        }),
        new TextRun({
          text: rightText,
          size: 22,
          font: 'Calibri',
        }),
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: 9000, // Right align at 5 inches
        },
      ],
      spacing: {
        after: 100,
      },
    });
  };

  // Helper function to create education entries (institution bold, then degree on next line)
  const createEducationEntry = (institution: string, degree: string, dates: string, grade?: string) => {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: institution,
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: '\t',
            size: 22,
          }),
          new TextRun({
            text: dates,
            size: 22,
            font: 'Calibri',
          }),
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: 9000,
          },
        ],
        spacing: {
          after: 80,
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${degree}${grade ? ` (Aggregate CGPA: ${grade})` : ''}`,
            size: 22,
            font: 'Calibri',
            bold: false, // Not bold for degree
          }),
        ],
        spacing: {
          after: 120,
        },
      }),
    ];
  };

  // Helper function for project entries with embedded links
  const createProjectEntry = (title: string, technologies: string[], liveLink?: string, githubLink?: string) => {
    const children = [
      new TextRun({
        text: title,
        bold: true,
        size: 22,
        font: 'Calibri',
      }),
    ];

    // Add Demo link if available
    if (liveLink) {
      children.push(
        new TextRun({
          text: ' | ',
          size: 22,
          font: 'Calibri',
        }),
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: 'Demo',
              size: 22,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          link: liveLink,
        })
      );
    }

    // Add GitHub link if available
    if (githubLink) {
      children.push(
        new TextRun({
          text: ' | ',
          size: 22,
          font: 'Calibri',
        }),
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: 'GitHub',
              size: 22,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          link: githubLink,
        })
      );
    }

    return new Paragraph({
      children,
      spacing: {
        after: 100,
      },
    });
  };

  // Helper function to categorize technical skills
  const categorizeSkills = (skills: string[]) => {
    const categories = {
      languages: [] as string[],
      frontend: [] as string[],
      backend: [] as string[],
      databases: [] as string[],
      tools: [] as string[],
    };

    const languageKeywords = ['javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'c', 'html', 'css'];
    const frontendKeywords = ['react', 'vue', 'angular', 'tailwind', 'bootstrap', 'sass', 'scss', 'jquery', 'webpack', 'vite', 'next.js', 'nuxt.js'];
    const backendKeywords = ['node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi', 'nestjs', 'koa'];
    const databaseKeywords = ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb', 'firebase', 'supabase'];
    const toolKeywords = ['git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab', 'github', 'jira', 'figma', 'postman', 'npm', 'yarn', 'linux', 'windows'];

    skills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (languageKeywords.some(keyword => lowerSkill.includes(keyword))) {
        categories.languages.push(skill);
      } else if (frontendKeywords.some(keyword => lowerSkill.includes(keyword))) {
        categories.frontend.push(skill);
      } else if (backendKeywords.some(keyword => lowerSkill.includes(keyword))) {
        categories.backend.push(skill);
      } else if (databaseKeywords.some(keyword => lowerSkill.includes(keyword))) {
        categories.databases.push(skill);
      } else if (toolKeywords.some(keyword => lowerSkill.includes(keyword))) {
        categories.tools.push(skill);
      } else {
        categories.tools.push(skill);
      }
    });

    return categories;
  };

  // Helper function to create skill category
  const createSkillCategory = (category: string, skills: string[]) => {
    if (skills.length === 0) return [];
    
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${category}: `,
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: skills.join(', '),
            size: 22,
            font: 'Calibri',
          }),
        ],
        spacing: {
          after: 100,
        },
        indent: {
          left: 360,
        },
      }),
    ];
  };

  // Generate professional summary
  const generateProfessionalSummary = () => {
    const hasWorkExperience = portfolio.workExperience && portfolio.workExperience.length > 0;
    const hasProjects = portfolio.projects && portfolio.projects.length > 0;
    const primarySkills = portfolio.technicalSkills?.slice(0, 4) || portfolio.skills.slice(0, 4);
    
    let summary = '';
    
    if (hasWorkExperience) {
      const latestJob = portfolio.workExperience![0];
      summary = `Experienced ${latestJob.title} with expertise in ${primarySkills.join(', ')}. `;
    } else {
      summary = `Motivated software developer with strong foundation in ${primarySkills.join(', ')}. `;
    }
    
    if (hasProjects) {
      summary += `Demonstrated ability to build full-stack applications and deliver innovative solutions. `;
    }
    
    if (portfolio.education.length > 0) {
      const education = portfolio.education[0];
      summary += `${education.degree} graduate from ${education.institution}. `;
    }
    
    summary += `Passionate about creating efficient, scalable software solutions and contributing to dynamic development teams.`;
    
    return summary;
  };

  // Format dates consistently
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + '-01'); // Add day for proper parsing
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Ensure LinkedIn URL is properly formatted
  const getLinkedInUrl = () => {
    let linkedinUrl = portfolio.linkedinUrl || portfolio.linkedin_url || '';
    
    // If URL doesn't start with http, add https://
    if (linkedinUrl && !linkedinUrl.startsWith('http')) {
      linkedinUrl = 'https://' + linkedinUrl;
    }
    
    return linkedinUrl;
  };

  // Ensure GitHub URL is properly formatted
  const getGitHubUrl = () => {
    let githubUrl = portfolio.githubUrl || portfolio.github_url || '';
    
    // If URL doesn't start with http, add https://
    if (githubUrl && !githubUrl.startsWith('http')) {
      githubUrl = 'https://' + githubUrl;
    }
    
    return githubUrl;
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt = 22 half-points
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header with Name (Font size 16, Bold, Center)
          new Paragraph({
            children: [
              new TextRun({
                text: portfolio.name.toUpperCase(),
                bold: true,
                size: 32, // 16pt = 32 half-points
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 120,
            },
          }),

          // Contact Information with proper LinkedIn link
          new Paragraph({
            children: [
              new TextRun({
                text: '📧 ',
                size: 22,
                font: 'Calibri',
              }),
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: portfolio.email,
                    size: 22,
                    font: 'Calibri',
                    color: '000000',
                  }),
                ],
                link: `mailto:${portfolio.email}`,
              }),
              new TextRun({
                text: '     📞 ',
                size: 22,
                font: 'Calibri',
              }),
              new TextRun({
                text: portfolio.phone || 'Phone not provided',
                size: 22,
                font: 'Calibri',
              }),
              ...(getGitHubUrl() ? [
                new TextRun({
                  text: '     ',
                  size: 22,
                  font: 'Calibri',
                }),
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: 'GitHub',
                      size: 22,
                      font: 'Calibri',
                      color: '000000',
                    }),
                  ],
                  link: getGitHubUrl(),
                }),
              ] : []),
              ...(getLinkedInUrl() ? [
                new TextRun({
                  text: '     ',
                  size: 22,
                  font: 'Calibri',
                }),
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: 'LinkedIn',
                      size: 22,
                      font: 'Calibri',
                      color: '000000',
                    }),
                  ],
                  link: getLinkedInUrl(),
                }),
              ] : []),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 240,
            },
          }),

          // Professional Summary Section
          ...createSectionHeading('Professional Summary'),
          new Paragraph({
            children: [
              new TextRun({
                text: generateProfessionalSummary(),
                size: 22,
                font: 'Calibri',
              }),
            ],
            spacing: {
              after: 240,
            },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // Work Experience Section
          ...(portfolio.workExperience && portfolio.workExperience.length > 0 ? [
            ...createSectionHeading('Work Experience'),
            ...portfolio.workExperience.flatMap((exp) => [
              createJobEntry(
                exp.company,
                exp.title,
                `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`
              ),
              ...exp.description.filter(desc => desc.trim()).map(desc => createBulletPoint(desc)),
              new Paragraph({
                text: '',
                spacing: { after: 120 },
              }),
            ]),
          ] : []),

          // Education Section (Fixed format: Institution bold with date, then degree on next line)
          ...(portfolio.education.length > 0 ? [
            ...createSectionHeading('Education'),
            ...portfolio.education.flatMap((edu) => 
              createEducationEntry(edu.institution, edu.degree, edu.year, edu.grade)
            ),
          ] : []),

          // Projects Section
          ...(portfolio.projects.length > 0 ? [
            ...createSectionHeading('Projects'),
            ...portfolio.projects.flatMap((project) => [
              createProjectEntry(
                project.title,
                project.technologies,
                project.liveLink,
                project.githubLink
              ),
              createBulletPoint(`Tech Stack: ${project.technologies.join(', ')}`),
              createBulletPoint(project.description),
              new Paragraph({
                text: '',
                spacing: { after: 120 },
              }),
            ]),
          ] : []),

          // Skills Section
          ...(portfolio.technicalSkills && portfolio.technicalSkills.length > 0 ? (() => {
            const skillCategories = categorizeSkills(portfolio.technicalSkills);
            return [
              ...createSectionHeading('Skills'),
              ...createSkillCategory('Programming Languages', skillCategories.languages),
              ...createSkillCategory('Frontend Technologies', skillCategories.frontend),
              ...createSkillCategory('Backend Technologies', skillCategories.backend),
              ...createSkillCategory('Database Management Systems (DBMS)', skillCategories.databases),
              ...createSkillCategory('Tools & Platforms', skillCategories.tools),
              new Paragraph({
                text: '',
                spacing: { after: 120 },
              }),
            ];
          })() : portfolio.skills.length > 0 ? [
            ...createSectionHeading('Skills'),
            createBulletPoint(portfolio.skills.join(', ')),
            new Paragraph({
              text: '',
              spacing: { after: 120 },
            }),
          ] : []),

          // Achievements/Certifications Section
          ...(portfolio.achievements.length > 0 ? [
            ...createSectionHeading('Certifications'),
            ...portfolio.achievements.map(achievement => createBulletPoint(achievement)),
          ] : []),
        ],
      },
    ],
  });

  // Generate and download the document
  const blob = await Packer.toBlob(doc);
  const fileName = `${portfolio.name.replace(/\s+/g, '_')}_ATS_Resume.docx`;
  saveAs(blob, fileName);
};