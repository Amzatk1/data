#Install necessary libraries
install.packages("corrplot")
install.packages("caret")
install.packages("ggplot2")
install.packages("GGally")
install.packages("openxlsx")

##############################DATA PROCESSING###################################
# Specifying the file path to the dataset
file_path <- "wdbc.data"

# Loading the dataset
bc_dataset <- read.csv(file_path, header = FALSE)

# Outputting the structure and summary
str(bc_dataset)
summary(bc_dataset)

# Assigning column names based on dataset documentation
colnames(bc_dataset) <- c(
  "ID", "Diagnosis", 
  "Radius_mean", "Texture_mean", "Perimeter_mean", "Area_mean", "Smoothness_mean",
  "Compactness_mean", "Concavity_mean", "Concave_points_mean", "Symmetry_mean", "Fractal_dimension_mean",
  "Radius_se", "Texture_se", "Perimeter_se", "Area_se", "Smoothness_se",
  "Compactness_se", "Concavity_se", "Concave_points_se", "Symmetry_se", "Fractal_dimension_se",
  "Radius_worst", "Texture_worst", "Perimeter_worst", "Area_worst", "Smoothness_worst",
  "Compactness_worst", "Concavity_worst", "Concave_points_worst", "Symmetry_worst", "Fractal_dimension_worst"
)

# Handling Outliers
bc_dataset_boxplot <- boxplot(bc_dataset$Radius_mean, main = "Boxplot for Radius Mean")
min_Radius_mean_outlier <- min(bc_dataset_boxplot$out)
bc_dataset_clean <- bc_dataset[bc_dataset$Radius_mean < min_Radius_mean_outlier, ]

bc_dataset_boxplot_texture <- boxplot(bc_dataset_clean$Texture_mean, main = "Boxplot for Texture Mean")
min_Texture_mean_outlier <- min(bc_dataset_boxplot_texture$out)
bc_dataset_clean <- bc_dataset_clean[bc_dataset_clean$Texture_mean < min_Texture_mean_outlier, ]

bc_dataset_boxplot_perimeter <- boxplot(bc_dataset_clean$Perimeter_mean, main = "Boxplot for Perimeter Mean")
min_Perimeter_mean_outlier <- min(bc_dataset_boxplot_perimeter$out)
bc_dataset_clean <- bc_dataset_clean[bc_dataset_clean$Perimeter_mean < min_Perimeter_mean_outlier, ]

bc_dataset_boxplot_area <- boxplot(bc_dataset_clean$Area_mean, main = "Boxplot for Area Mean")
min_Area_mean_outlier <- min(bc_dataset_boxplot_area$out)
bc_dataset_clean <- bc_dataset_clean[bc_dataset_clean$Area_mean < min_Area_mean_outlier, ]

bc_dataset_boxplot_area <- boxplot(bc_dataset_clean$Compactness_mean, main = "Boxplot for Compactness mean")
min_Compactness_mean_outlier <- min(bc_dataset_boxplot_area$out)
bc_dataset_clean <- bc_dataset_clean[bc_dataset_clean$Compactness_mean < min_Compactness_mean_outlier, ]

# Encoding Diagnosis (1 = Malignant and 0 = Benign)
bc_dataset_clean$Diagnosis <- ifelse(bc_dataset_clean$Diagnosis == "M", 1, 
                                     ifelse(bc_dataset_clean$Diagnosis == "B", 0, NA))
bc_dataset_clean$Diagnosis <- factor(bc_dataset_clean$Diagnosis, levels = c(0, 1), labels = c("Benign", "Malignant"))

sum(is.na(bc_dataset_clean$Diagnosis))

# Normalising numeric features
numeric_cols <- sapply(bc_dataset_clean, is.numeric)
bc_dataset_clean[, numeric_cols] <- scale(bc_dataset_clean[, numeric_cols])

# Calculating and visualising the correlation matrix to remove highly correlated features(exc. Radius_mean, Texture_mean, Smoothness_mean, Concavity_mean)
library(corrplot)
cor_matrix <- cor(bc_dataset_clean[, numeric_cols])
corrplot::corrplot(cor_matrix, method = "circle", tl.cex = 0.8, number.cex = 0.7)

library(caret)
high_corr <- findCorrelation(cor_matrix, cutoff = 0.85, verbose = TRUE, names = TRUE)
features_to_remove <- setdiff(high_corr, c("Texture_mean", "Concavity_mean"))
bc_dataset_clean <- bc_dataset_clean[, !colnames(bc_dataset_clean) %in% features_to_remove]

selected_features <- c("Radius_mean", "Texture_mean", "Smoothness_mean", "Concavity_mean")
bc_dataset_clean <- bc_dataset_clean[, c(selected_features, "Diagnosis")]

# Checking the columns to make sure the correct features remain
colnames(bc_dataset_clean)

# Final dataset check
summary(bc_dataset_clean)
str(bc_dataset_clean)

# Preparing the training/testing set
n_rows <- nrow(bc_dataset_clean)
training_idx <- sample(n_rows, n_rows * 0.8)
training_bc_dataset <- bc_dataset_clean[training_idx, ]  # 80% Training set
testing_bc_dataset <- bc_dataset_clean[-training_idx, ]  # 20% Testing set

# Checking the dimensions of the training/testing sets
cat("Training set size:", nrow(training_bc_dataset), "\n")
cat("Testing set size:", nrow(testing_bc_dataset), "\n")

# Saving the training and testing datasets
write.csv(training_bc_dataset, "training_bc_dataset.csv", row.names = FALSE)
write.csv(testing_bc_dataset, "testing_bc_dataset.csv", row.names = FALSE)

##############################DATA EXPLORATION##################################
# Checking the structure and summary statistics for all numeric columns
str(bc_dataset_clean)
summary(bc_dataset_clean)

# Plotting histograms for individual features
library(ggplot2)
ggplot(bc_dataset_clean, aes(x = Radius_mean)) +
  geom_histogram(bins = 30, fill = "blue", color = "black") +
  theme_minimal() +
  labs(title = "Histogram of Radius Mean", x = "Radius Mean", y = "Frequency")
ggplot(bc_dataset_clean, aes(x = Texture_mean)) +
  geom_histogram(bins = 30, fill = "green", color = "black") +
  theme_minimal() +
  labs(title = "Histogram of Texture Mean", x = "Texture Mean", y = "Frequency")
ggplot(bc_dataset_clean, aes(x = Smoothness_mean)) +
  geom_histogram(bins = 30, fill = "orange", color = "black") +
  theme_minimal() +
  labs(title = "Histogram of Smoothness Mean", x = "Smoothness Mean", y = "Frequency")
ggplot(bc_dataset_clean, aes(x = Concavity_mean)) +
  geom_histogram(bins = 30, fill = "purple", color = "black") +
  theme_minimal() +
  labs(title = "Histogram of Concavity Mean", x = "Concavity Mean", y = "Frequency")

# Plotting density plots for individual features
ggplot(bc_dataset_clean, aes(x = Radius_mean)) +
  geom_density(fill = "blue", alpha = 0.5) +
  theme_minimal() +
  labs(title = "Density Plot of Radius Mean", x = "Radius Mean", y = "Density")
ggplot(bc_dataset_clean, aes(x = Texture_mean)) +
  geom_density(fill = "green", alpha = 0.5) +
  theme_minimal() +
  labs(title = "Density Plot of Texture Mean", x = "Texture Mean", y = "Density")
ggplot(bc_dataset_clean, aes(x = Smoothness_mean)) +
  geom_density(fill = "orange", alpha = 0.5) +
  theme_minimal() +
  labs(title = "Density Plot of Smoothness Mean", x = "Smoothness Mean", y = "Density")
ggplot(bc_dataset_clean, aes(x = Concavity_mean)) +
  geom_density(fill = "purple", alpha = 0.5) +
  theme_minimal() +
  labs(title = "Density Plot of Concavity Mean", x = "Concavity Mean", y = "Density")

# Plotting box plots for individual features
ggplot(bc_dataset_clean, aes(x = Diagnosis, y = Radius_mean, fill = Diagnosis)) +
  geom_boxplot() +
  theme_minimal() +
  labs(title = "Boxplot of Radius Mean by Diagnosis", x = "Diagnosis", y = "Radius Mean")
ggplot(bc_dataset_clean, aes(x = Diagnosis, y = Texture_mean, fill = Diagnosis)) +
  geom_boxplot() +
  theme_minimal() +
  labs(title = "Boxplot of Texture Mean by Diagnosis", x = "Diagnosis", y = "Texture Mean")
ggplot(bc_dataset_clean, aes(x = Diagnosis, y = Smoothness_mean, fill = Diagnosis)) +
  geom_boxplot() +
  theme_minimal() +
  labs(title = "Boxplot of Smoothness Mean by Diagnosis", x = "Diagnosis", y = "Smoothness Mean")
ggplot(bc_dataset_clean, aes(x = Diagnosis, y = Concavity_mean, fill = Diagnosis)) +
  geom_boxplot() +
  theme_minimal() +
  labs(title = "Boxplot of Concavity Mean by Diagnosis", x = "Diagnosis", y = "Concavity Mean")

# Performing PCA on selected features
pc_bc <- prcomp(bc_dataset_clean[, c("Radius_mean", "Texture_mean", "Smoothness_mean", "Concavity_mean")], center = TRUE, scale = TRUE)
pc_bc_var <- pc_bc$sdev^2
pc_bc_PEV <- pc_bc_var / sum(pc_bc_var)

# Plotting the cumulative proportion of explained variance (PEV)
opar <- par(no.readonly = TRUE)
plot(
  cumsum(pc_bc_PEV), 
  ylim = c(0, 1), 
  xlab = 'Principal Component', 
  ylab = 'Cumulative Proportion of Explained Variance (PEV)', 
  pch = 20, 
  col = 'orange'
)

# Inspecting the loadings
pc_bc_loadings <- pc_bc$rotation
pc_bc_loadings

# Generating a biplot for the first two principal components (PC1 and PC2)
opar <- par(no.readonly = TRUE)
biplot(
  pc_bc, 
  scale = 0, 
  col = c('grey40', 'orange')
)
par(opar)


# Creating a summary table for the selected features
summary_table <- data.frame(
  Feature = c("Radius_mean", "Texture_mean", "Smoothness_mean", "Concavity_mean"),
  Description = c(
    "Mean of the distances from the center to points on the perimeter of the tumor. Larger values typically indicate a more malignant tumor.",
    "Measures the local variation in the grayscale intensities of the tumor. Higher values can indicate malignant tumors.",
    "Describes the smoothness of the tumor's contour. Tumors with more irregular shapes often have lower smoothness and may be malignant.",
    "Measures the degree of concavity (i.e., how much the tumor’s contour is indented). Malignant tumors tend to have more concave features."
  ),
  Data_Type = c("Numeric", "Numeric", "Numeric", "Numeric"),
  Importance = c(
    "Highly correlated with malignancy. Larger radius values are often seen in malignant tumors.",
    "Texture is an important feature for classifying tumors. Malignant tumors typically have irregular texture patterns.",
    "Smoothness indicates the regularity of the tumor's shape. Benign tumors tend to be smoother.",
    "Concavity is directly related to the irregularity of the tumor shape. More concave shapes are more likely to be malignant."
  )
)

# Displaying the summary table
library(openxlsx)
write.csv(summary_table, "feature_summary_table.csv", row.names = FALSE)
write.xlsx(summary_table, "feature_summary_table.xlsx")
print(summary_table)
