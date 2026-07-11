// Project data shape — plan Task 3.4. Link policy lives in the data (see
// projects.ts + README §Project links), never hardcoded in markup.

export type ProjectStatus = 'active' | 'recently-active' | 'heating-up';

export interface ProjectExtraLink {
	url: string;
	label: string;
}

export interface Project {
	name: string;
	status: ProjectStatus;
	blurb: string;
	tech: string;
	repoUrl?: string;
	siteUrl?: string;
	siteLabel?: string;
	extraLink?: ProjectExtraLink;
	private: boolean;
}
