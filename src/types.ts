export interface Recipe {
  id: string;
  title: string;
  description: string;
  meatType: string;
  spiciness: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  prepTime: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  ingredients: { name: string; amount: string }[];
  instructions: string;
  tags: string[];
}

export interface FilterState {
  meatType: string;
  spiciness: string;
  difficulty: string;
  maxTime: string;
  searchQuery: string;
  allergy: string;
  chef: string;
}
