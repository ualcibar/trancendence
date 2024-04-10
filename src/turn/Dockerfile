FROM coturn/coturn:alpine

# Copy custom turnserver.conf configuration file into the container
COPY turnserver.conf /etc/turnserver.conf

# Expose port for TURN server
EXPOSE 3478
EXPOSE 3478/udp

# Start coturn server with custom configuration file
CMD ["turnserver", "-c", "/etc/turnserver.conf"]
#CMD ["turnserver"]
